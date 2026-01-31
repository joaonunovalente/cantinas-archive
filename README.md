# Cantinas.pt

**Cantinas.pt** is a free-access web platform that aggregates and displays the menus from the University of Aveiro’s canteens. It retrieves real-time data directly from the university’s official API, ensuring accurate and up-to-date information.

## Project Summary

Designed for speed and reliability, **Cantinas.pt** uses a Cloudflare Worker as an intermediary layer for API requests. This architecture reduces latency and guarantees near-instant load times even during peak traffic.

On page load, the frontend script requests menu data for the current day via the Cloudflare Worker API endpoint. The data, structured by canteen and meal period, is parsed and dynamically injected into the page, showing the categorized dishes.

## Technical Overview

- **Frontend:**  
  - Adapts [DevDesk](https://github.com/xriley/DevDesk-Theme) theme

- **Middleware:**  
  - Cloudflare Worker proxying API requests  
  - Caches and reduces API response latency  

- **Data Source:**  
  - University of Aveiro official canteens API  

- **Hosting:**  
  - Hosted and served via Cloudflare

## Contact

For feedback, questions, or collaboration inquiries, please reach out at:  
- **contacto@cantinas.pt**