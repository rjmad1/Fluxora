module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "npm install"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "docker --version"
      }
    },
    {
      method: "fs.copy",
      params: {
        src: ".env.example",
        dest: "apps/backend/.env"
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
