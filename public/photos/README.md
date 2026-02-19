This directory is used to store student photos.
In a production environment, photos should be uploaded to a cloud storage service (e.g., AWS S3, Firebase Storage).
For this demo, photos are compressed client-side and stored as Base64 strings in the application state.
To persist photos, you would typically implement an API endpoint to save the files here.
