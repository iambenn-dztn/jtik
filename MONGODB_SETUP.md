# MongoDB Setup Instructions

## For Production (Render.com)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Under "Database Access", create a database user with username/password
5. Under "Network Access", add IP `0.0.0.0/0` (allow from anywhere)
6. Get your connection string from "Connect" > "Connect your application"
   - Format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/jtik?retryWrites=true&w=majority`
7. In Render.com dashboard:
   - Go to your service settings
   - Add environment variable: `MONGODB_URI` = your connection string

## For Local Development

MongoDB runs in Docker Compose:
```bash
docker-compose up -d mongodb
```

Connection string: `mongodb://localhost:27017/jtik`
