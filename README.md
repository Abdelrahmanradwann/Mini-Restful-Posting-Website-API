## Overview

This project is a web application that allows users to post various types of content, including images, videos, and text. Built using **Node.js** and the **Express** framework, the application is designed to handle high traffic and provide a seamless user experience.

### Key Components:
- **Node.js with Express**: The core backend framework that handles server-side logic and routing for the application.
- **Docker**: Utilized to run multiple containers, enabling isolated environments for the main server and associated services. This approach simplifies deployment and scaling.
- **Apache Kafka**: Implemented as the messaging system for event streaming, allowing for real-time data processing and communication between different parts of the application.
- **Nginx**: Used as a load balancer to distribute incoming requests between two main server containers. Nginx also includes a health check feature to ensure traffic is only directed to healthy servers.
- **MinIO**: Chosen for object storage, MinIO provides a high-performance and scalable solution for storing media files securely.
- **MySQL**: The relational database management system used to store metadata and other structured data, ensuring efficient data retrieval and manipulation.

This architecture ensures reliability, scalability, and performance, making the application well-suited for managing a variety of user-generated content.

## Use Case

This is the use case diagram for the project:

![image](https://github.com/user-attachments/assets/f91f7800-db34-482f-9e01-41895cc82bfd)

## Docker architecture
![image](https://github.com/user-attachments/assets/6e53f5ea-c477-49d6-9fca-bd2d83772279)

## System design
![image](https://github.com/user-attachments/assets/21a8d5e3-52eb-46d9-a5ab-f7e6c4ee63ac)

### Load balancing

I chose **Layer 7 (L7) load balancing** for its flexibility and ability to inspect HTTP headers, allowing intelligent routing based on request content. Unlike Layer 4 (L4), which operates at the transport layer and routes based solely on IP addresses and ports, L7 enables me to direct traffic efficiently and implement features like SSL termination and detailed health checks.

### Apache Kafka

I used **KRaft** mode for Apache Kafka instead of ZooKeeper because it offers lower overhead and simplifies the architecture by combining the roles of brokers and controllers into a single system. In this setup, Kafka serves as the messaging system where producers send metadata to the brokers. The consumers, specifically the encoding services, then retrieve the necessary metadata to access the media from the buffer store, encode it, and save it to the permanent object store.

I was initially confused about whether to use **Apache Kafka** or **RabbitMQ** for my messaging system. Ultimately, I chose Kafka because it offers greater scalability and high throughput, making it more suitable for handling large volumes of data. Additionally, Kafka uses a pull model, allowing consumers to request messages at their own pace, which is ideal for scenarios where numerous posts need to be encoded. In contrast, RabbitMQ employs a push model, which may lead to overwhelming the consumers if there is a sudden spike in messages.


