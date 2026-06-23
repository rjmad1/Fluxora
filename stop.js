module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "docker compose -f docker-compose.infra.yaml stop"
      }
    }
  ]
}
