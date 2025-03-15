# myinsta

## Project Overview

myinsta is a web application that replicates the core functionalities of Instagram. It allows users to register, log in, create posts with images or videos, follow other users, like posts, and comment on posts. The application is built using Flask, a lightweight web framework for Python, and utilizes SQLite for the database. The project also incorporates real-time features using Flask-SocketIO.

## Project Structure

The project is organized into several directories and files, each serving a specific purpose. Below is a detailed explanation of the key files and directories:

### Root Directory

- **config.py**: This file contains the configuration settings for the application, including debug mode, secret keys, content folder path, JWT secret, and database URL. It loads environment variables using the `dotenv` package.
- **database.db**: The SQLite database file that stores all the data for the application.
- **Dockerfile**: A file that contains instructions for building a Docker image for the application. It sets up the environment, installs dependencies, and initializes the database.
- **requirements.txt**: A file that lists all the Python dependencies required for the project.
- **run.py**: The main entry point of the application. It creates and runs the Flask application, initializing the SocketIO instance.
- **schema.sql**: A SQL script that defines the database schema, including tables for users, posts, comments, and likes.
- **.env.example**: An example environment file that lists the required environment variables for the application.
- **.gitignore**: A file that specifies which files and directories should be ignored by Git.

### app Directory

- **__init__.py**: Initializes the Flask application, loads configuration settings, and registers blueprints for different routes.
- **extensions.py**: Initializes and configures extensions used in the application, such as the database connection and SocketIO.
- **routes**: This directory contains route handlers for different parts of the application:
  - **auth_routes.py**: Handles authentication-related routes, including login, registration, and logout.
  - **cdn_routes.py**: Handles routes for serving content from the content folder.
  - **main_routes.py**: Handles the main routes of the application, including the home page and user profiles.
  - **api_routes.py**: Handles API routes for creating posts, validating email and username, fetching posts, following users, liking posts, and commenting on posts.
- **services**: This directory contains service classes that encapsulate business logic:
  - **cdn_services.py**: Contains the `CDNServices` class, which handles serving content (images and videos) from the content folder.
  - **post_services.py**: Handles operations related to posts, such as creating new posts, fetching posts, liking posts, and fetching comments.
  - **user_services.py**: Handles operations related to users, such as login, registration, logout, following users, and commenting on posts.
- **static**: This directory contains static files such as CSS, JavaScript, and images:
  - **css**: Contains CSS files for styling different parts of the application.
  - **js**: Contains JavaScript files for client-side functionality, including handling infinite scroll, post creation, search, and real-time comments.
- **templates**: This directory contains HTML templates for different pages of the application:
  - **base.html**: The base template that includes common elements such as the sidebar and navigation bar.
  - **index.html**: The template for the home page, which displays posts from followed users.
  - **profile.html**: The template for user profile pages, which displays the user's posts and profile information.
  - **register.html**: The template for the registration page.
  - **login.html**: The template for the login page.

### utils Directory

- **auth.py**: Contains the `login_required` decorator, which ensures that routes are accessible only to authenticated users.
- **jwt.py**: Contains functions for creating and validating JWT tokens.
- **sql.py**: Contains the `SQL` class, which provides methods for executing SQL queries and interacting with the SQLite database.
- **uuid.py**: Contains functions for generating unique IDs for posts and comments.

## MVC Architecture

The project follows the Model-View-Controller (MVC) architectural pattern, which separates the application into three interconnected components:

### Model

The Model represents the data and the business logic of the application. It is responsible for managing the data, whether it is stored in a database or in memory. In this project, the Model is implemented using the `SQL` class in `app/utils/sql.py`, which interacts with the SQLite database. The database schema is defined in `schema.sql`, which includes tables for users, posts, comments, likes, and follows.

### View

The View is responsible for presenting the data to the user. It defines how the data should be displayed and handles the user interface. In this project, the View is implemented using HTML templates located in the `app/templates` directory. These templates are rendered by Flask and include `base.html`, `index.html`, `profile.html`, `register.html`, and `login.html`. The static files such as CSS and JavaScript, located in the `app/static` directory, are also part of the View.

### Controller

The Controller acts as an intermediary between the Model and the View. It handles user input, processes it, and updates the Model and the View accordingly. In this project, the Controller is implemented using route handlers located in the `app/routes` directory. These route handlers include `auth_routes.py`, `cdn_routes.py`, `main_routes.py`, and `api_routes.py`. The business logic is encapsulated in service classes located in the `app/services` directory, such as `cdn_services.py`, `post_services.py`, and `user_services.py`.

## Design Choices

### Authentication

The application uses JWT tokens for authentication. The `login_required` decorator ensures that routes are accessible only to authenticated users. The tokens are stored in cookies with the `HttpOnly` and `Secure` flags to enhance security.

### Real-Time Features

The application incorporates real-time features using Flask-SocketIO. This allows for real-time updates of comments on posts, providing a more interactive user experience.

### Database

SQLite is used as the database for this project. It is lightweight and easy to set up, making it suitable for this application. The database schema is defined in `schema.sql`, which includes tables for users, posts, comments, likes, and follows.

### File Uploads

The application supports uploading images and videos for posts. The files are stored in a designated content folder, and the `CDNServices` class handles serving these files to clients.

### Frontend

The frontend is built using HTML, CSS, and JavaScript. Bootstrap is used for styling and responsive design. The application includes features such as infinite scroll, modal dialogs for creating posts and viewing post details, and a search functionality.

## Conclusion

myinsta is a comprehensive web application that replicates the core functionalities of Instagram. It is built using Flask and SQLite, with real-time features powered by Flask-SocketIO. The project is well-structured, with clear separation of concerns and modular design. The README.md provides a detailed overview of the project, its structure, and the design choices made during development. This documentation ensures that the project is easy to understand and maintain.