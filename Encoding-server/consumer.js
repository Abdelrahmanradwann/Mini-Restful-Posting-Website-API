const ffmpeg = require('fluent-ffmpeg');
const { consumer } = require('./util/kafka_helper');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const { bufferStorage, objectStore } = require('./util/storage_helper');
const { Post } = require('./models/Post');
const fs = require('fs').promises;
const path = require('path');
const { PassThrough } = require('stream');


ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);



async function consume() {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, "fromBeginning": true,});
        console.log(`Subscribed to topic: ${process.env.KAFKA_TOPIC}`);
    }
    catch (err) {
        console.log('Consumer failed to connect: ', err);
        throw new Error('Consumer failed to connect');
    }

    const resolutions = [
        { width: 640, height: 480, label: 'SD' },   // 480p
        { width: 1280, height: 720, label: 'HD' },  // 720p
        { width: 1920, height: 1080, label: 'Full HD' }, // 1080p
    ];
    await consumer.run({
        'eachMessage': async ({ topic, partition, message }) => {

            console.log(`RVD Msg ${message.value} on partition ${partition}`)
            const { objectName, userId, createdAt, media, content } = JSON.parse(message.value.toString());
            const bucket = media == 'photo' ? 'photos' : 'videos';
            try {
                let object = await bufferStorage.getObject(bucket, objectName)
                let objName = objectName.split('.').slice(0, -1).join('.'); // Get everything except the extension
                let objExtension = objectName.split('.').pop();
                let objPath = path.join(__dirname, 'tmp', `${objName}.${objExtension}`);
                if (media == 'video') {
                    console.log(`Object path > ${objPath}`)
                    await fs.writeFile(objPath, object);
                    console.log('File written to:', objPath);
                    const metadata = await getVideoMetadata(await bufferStorage.getObject(bucket, objectName)); // calling get object as getVideoMetaData needs to operate it in chunks so we need a readable stream which we will get from bufferStorage.getObject


                    const promises = resolutions.map(i => {
                    if (metadata.width >= i.width || metadata.height >= i.height) {
                            console.log(`Encoding video to ${i.label}`);
                            return encodeStream(i, objName, objExtension);  // Return the promise
                        }
                    });     

                    // Filter out any undefined promises (from resolutions that didn't match the condition)
                    await Promise.all(promises.filter(Boolean));

                    // delete video after encoding
                    try {
                        fs.rm(objPath)
                    } catch (err) {
                        throw new Error(`Error while deleting the local file: ${err.message}`)
                    }
                }
                else {    
                    await objectStore.putObject(bucket, objectName, object, async (err, etag) => {
                        if (err) {
                            console.log('Error uploading to MinIO: ', err);
                            return res.status(500).json({ message: 'Failed to upload photo', error: err.message });
                        }       
                    });
                }

                await bufferStorage.removeObject(bucket, objectName, function(err) {
                    if (err) {
                        return console.log('Unable to remove object:', err);
                    }
                    console.log('Successfully removed the object buffer:', objectName);
                });

                let post = new Post({
                    content: content,
                    media: 1,
                    userId: userId,
                    createdAt: createdAt,
                    numComments: 0,
                    numLikes: 0
                });
                post = await post.create();
                if (!post) {
                    throw new Error({
                        msg: 'Failed to create post'
                    })
                }
                console.log('Process is done successfully');


            } catch (err) {
                console.log('Error while getting object from MinIO buffer and encoding it ',err );
                throw new Error('Error while getting object from MinIO buffer and encoding it');
            }
            
        }

    })
}


// cannot use passthrough if the extension was mp4 ( ?? )
const encodeStream = (resolution, objectname, outputFormat = 'webm') => {
    return new Promise(async (resolve, reject) => {
        outputFormat = 'webm'
        const stream = new PassThrough();
        let videoname = `${objectname}.${outputFormat}`;
        try {
            let objPath = path.join(__dirname, 'tmp', `${objectname}.mp4`);
            console.log(objPath)
            const ffmpegCommand = ffmpeg(objPath)
                .size(`${resolution.width}x${resolution.height}`);

            if (outputFormat === 'mp4') {
                ffmpegCommand
                    .videoCodec('libx264') // Use H.264 for MP4
                    .outputOptions([
                        '-crf 23', // Adjust CRF for MP4 (23 is a good balance between quality and file size)
                        '-preset medium', // Adjust encoding speed vs quality
                        '-movflags +faststart' // Enable progressive download
                    ]);
            } else if (outputFormat === 'webm') {
                ffmpegCommand
                    .videoCodec('libvpx-vp9') // Use VP9 for WebM
                    .outputOptions([
                        '-crf 30',  // Adjust CRF value for WebM
                        '-g 30',    // Set GOP size for WebM (keyframe interval)
                        '-b:v 0'    // Set constant quality mode for WebM
                    ]);
            }

            ffmpegCommand
                .outputFormat(outputFormat)
                .on('progress', (p) => {
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('FFmpeg error:', err, stdout, stderr);
                    stream.end();
                    reject(err);
                })
                .on('end', () => {
                    console.log('Processing finished successfully');
                    resolve();
                })
                .pipe(stream, { end: true });

            await objectStore.putObject('videos', videoname, stream).catch(err => {
                console.error('Error saving to MinIO:', err);
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};


const getVideoMetadata = (inputStream) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputStream, (err, metadata) => {
            if (err) return reject(err);
            console.log(`In get video metadata ${(metadata)}`)
            const { width, height } = metadata.streams[0];
            resolve({ width, height });
        });
    });
};


consume(); 