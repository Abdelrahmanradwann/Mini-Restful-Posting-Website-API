const ffmpeg = require('fluent-ffmpeg');
const { consumer } = require('./util/kafka_helper');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const { bufferStorage, objectStore } = require('./util/storage_helper');
const { Post } = require('./models/Post');
const fs = require('fs/promises');
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
console.log('whyyyyyyyyyyy')
    await consumer.run({
        'eachMessage': async ({ topic, partition, message }) => {

            console.log(process.env.TOPIC_PARTITION)
            console.log(`RVD Msg ${message.value} on partition ${partition}`)
            // console.log(message.value);
                 console.log("nooooooooooooooooooooooooooooo")
            const { objectName, userId, createdAt, media, content } = JSON.parse(message.value.toString());
            const bucket = media == 'photo' ? 'photos' : 'videos';
            try {
           
                 console.log('afterrrrrrrrrrrrrrrrrr')
                console.log(objectName)
                let object = await bufferStorage.getObject('photos', objectName)
               
                let objName = objectName.split('.').slice(0, -1).join('.'); // Get everything except the extension
                let objExtension = objectName.split('.').pop(); // Get the extension
                let objPath = `./tmp/${objName}.${objExtension}`;
                if (media == 'video') {
                  
                    await fs.writeFile(objPath, object);

                    const metadata = await getVideoMetadata(object);
                    let tasks = resolutions
                        .filter(res => metadata.width > res.width || metadata.height > res.height)
                        .map(async res => {
                            return encodeStream(res, objName, objExtension);
                        });
                    
                    
                    await Promise.all(tasks);
                        

                        // delete video after encoding
                    fs.rm(`./tmp/${objName + objExtension}`).catch(err => console.log('del file: ', err));
                }
                       
                else {    
                    await objectStore.putObject(bucket, objectName, object, async (err, etag) => {
                        if (err) {
                            console.log('Error uploading to MinIO: ', err);
                            return res.status(500).json({ message: 'Failed to upload photo', error: err.message });
                        }       
                    });
                }

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


const encodeStream = (resolution, objectname, ext) => {
    return new Promise(async (resolve, reject) => {
        const stream = new PassThrough();
        let videoname = `${objectname}.mp4`;
        console.log('encoding');
        // Pipe the ffmpeg output to MinIO
        try {

            ffmpeg(`./tmp/${objectname + ext}`)
                .size(`${resolution.width}x${resolution.height}`)
                .videoCodec('libvpx-vp9')
                .outputOptions([
                    '-crf 30', // Adjust the CRF value based on your quality needs (lower is better quality)
                    '-g 30', // Set GOP size (keyframe interval)
                    '-b:v 0',
                ])
                .outputFormat('webm')
                .on('progress', (p) => {
                    // console.log('Progress:', p);
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('FFmpeg error:', err, stdout, stderr);
                    stream.end();
                    reject(err);
                })
                .on('end', () => {
                    console.log('Processing finished successfully');
                    resolve()
                })
                .pipe(stream, { end: true })

            await objectStore.putObject('videos', videoname, stream).catch(err => {
                console.error('Error putting object to MinIO:', err);
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
            // extract resolution
            const { width, height } = metadata.streams[0];
            resolve({ width, height });
        });
    });
};


 consume();