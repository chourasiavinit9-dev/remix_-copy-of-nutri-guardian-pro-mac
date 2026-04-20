# Step 1: Build the Vite React App
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We must build the production artifacts
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine
# Copy the built app to Nginx's web root directory
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration (handles Vite's client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
