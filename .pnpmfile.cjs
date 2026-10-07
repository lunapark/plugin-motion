function readPackage(pkg) {
    if (pkg.name.includes("@luna-park/design")) {
        pkg.peerDependencies["@fortawesome/pro-solid-svg-icons"] = "link:../../@fortawesome/pro-solid-svg-icons";
        pkg.peerDependencies["@fortawesome/pro-regular-svg-icons"] = "link:../../@fortawesome/pro-regular-svg-icons";
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage
    }
};
