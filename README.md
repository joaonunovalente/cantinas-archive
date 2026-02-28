<div align="center">
<br>

  ![logo](assets/img/logo/logo-color.svg)

<br>
</div>

# Cantinas.pt - Archived

**This project is archived and no longer maintained.**  
The archived version is available at: [arquivo.cantinas.pt](https://arquivo.cantinas.pt)

---

## About the Project

**Cantinas.pt** is a free-access web platform that aggregates and displays menus from the canteens.  
It retrieves real-time data directly from the university’s official API.

## Project Summary

The platform was designed for **speed and reliability**, using a **Cloudflare Worker** as an intermediary layer for API requests.  
This architecture reduces latency and ensures near-instant load times even during peak traffic.

On page load, the frontend script requests menu data for the current day via the Cloudflare Worker API endpoint.  
The data, structured by canteen and meal period, is parsed and dynamically injected into the page, showing the categorized dishes.

## Technical Overview

- **Frontend:**  
  - Based on the [DevDesk](https://github.com/xriley/DevDesk-Theme) theme

- **Middleware:**  
  - Cloudflare Worker proxying API requests  
  - Caching to reduce response latency  

- **Data Source:**  
  - University of Aveiro official canteens API  

- **Hosting:**  
  - Served via Cloudflare

## Contact

For questions or feedback, contact:

- **Email:** contacto@cantinas.pt
