module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "docker compose -f docker-compose.infra.yaml down -v"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: "apps/backend/.env"
      }
    }
  ]
}
