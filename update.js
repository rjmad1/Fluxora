module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git pull"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "npm install"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "npx prisma generate --schema=apps/backend/prisma/schema.prisma"
      }
    }
  ]
}
