const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.log("logout middelware running!");
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log('token: ' + token);
    if (token === 'null') {
      console.log('logout check success (not logged in - as expected)');
      next();
    } else {
      console.log('logout check faild');
      res.status(401).json({ message: "Already logged in!" });
    }

  } catch (error) {
    console.log('logout check faild');
    console.log(error);
    res.status(401).json({ message: "Auth failed!" });
  }
};
