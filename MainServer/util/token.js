const jwt = require('jsonwebtoken')

exports.genToken = (payload) => {
    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' })
}


exports.validateToken = (req, res, next) => {
    const token = req.headers['Authorization']?.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ msg: 'No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        req.user = decoded; 
        next();
    });
}