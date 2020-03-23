FROM node:10-alpine
WORKDIR /home/app/
COPY . .
EXPOSE 8080
CMD ["npm", "start"]