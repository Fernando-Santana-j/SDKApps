module.exports = {
    apps: [
        {
            name: "sdkapps",
            script: "./index.js",
            watch: true,
            ignore_watch: ["node_modules", "logs", "uploads", 'test','DataBase'], 
            watch_options: {
                followSymlinks: false,
                usePolling: true, 
            },
        },
    ],
};
