FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the privacy policy HTML file
COPY PRIVACY_POLICY.html /usr/share/nginx/html/privacy.html

# Copy a simple index file for root
COPY index.html /usr/share/nginx/html/index.html

# Copy 404 error page
COPY 404.html /usr/share/nginx/html/404.html

# Copy favicon
COPY favicon.ico /usr/share/nginx/html/favicon.ico

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]