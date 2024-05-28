module.exports = {
    apps: [
        {
            name: "sdkapps",
            script: "./index.js",
            watch: true, // Habilita o watch para monitorar mudanças
            ignore_watch: ["node_modules", "logs", "uploads", 'test'], // Adicione aqui a pasta que você quer ignorar
            watch_options: {
                followSymlinks: false,
                usePolling: true, // Esta opção pode ser útil em alguns casos de sistema de arquivos, mas pode aumentar o uso de CPU
            },
        },
    ],
};
