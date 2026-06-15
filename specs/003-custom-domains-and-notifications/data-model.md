# Data Model: Custom Domains & Email Notifications

## Prisma Schema Additions

### Workspace
Modify `Workspace` to store custom domains for dynamic routing:
```prisma
model Workspace {
  id                    String                       @id @default(uuid())
  tenantId              String
  tenant                Tenant                       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name                  String
  customDomain          String?                      @unique // New field for host routing mapping
  accounts              ConnectedAccount[]
  posts                 Post[]
  assets                Asset[]
  notificationSettings  WorkspaceNotificationSettings?
  createdAt             DateTime                     @default(now())
}
```

### WorkspaceNotificationSettings
New entity storing client email configuration for approval loops:
```prisma
model WorkspaceNotificationSettings {
  id               String    @id @default(uuid())
  workspaceId      String    @unique
  workspace        Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  clientEmail      String?   // Recipient for client approvals
  notifyOnDecision Boolean   @default(true)
}
```

### Post
Extend `Post` to track who submitted the post (creator email) for notification on decisions:
```prisma
model Post {
  id             String        @id @default(uuid())
  workspaceId    String
  workspace      Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  content        String
  scheduledAt    DateTime
  status         String        @default("Draft")
  feedback       String?
  createdByEmail String?       // Email to notify when client approves/rejects
  createdAt      DateTime      @default(now())
  variants       PostVariant[]
}
```
