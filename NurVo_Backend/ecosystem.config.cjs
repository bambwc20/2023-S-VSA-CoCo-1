module.exports = {
  apps: [
    {
      name: "NurseApp",
      script: "./server.mjs",
      // Delay between restart,
      watch: true,
      watch_delay: 1000,
      ignore_watch: [
        "pids",
        "logs",
        "node_modules",
        "bower_components",
        ".git",
        ".git/index.lock",
        ".idea",
        ".env",
      ],
    },
  ],
};
