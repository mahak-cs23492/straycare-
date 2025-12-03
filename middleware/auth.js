// middleware

exports.isLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/auth/login/local");
    }
    next();
};

exports.isLocalUser = (req, res, next) => {
    if (req.session.userKind !== "LOCAL") {
        return res.status(403).send("Only public users can access this.");
    }
    next();
};

exports.isNGO = (req, res, next) => {
    if (req.session.userKind !== "NGO") {
        return res.status(403).send("Only NGOs can access this.");
    }
    next();
};
