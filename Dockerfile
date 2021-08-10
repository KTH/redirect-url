FROM kthse/kth-nodejs:16.0.0

COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]

RUN npm audit fix && \
    npm install --production --loglevel warn && \ 
    npm prune    

COPY ["config", "config"]
COPY ["modules", "modules"]
COPY ["app.js", "app.js"]

EXPOSE 80

CMD ["npm", "start"]
