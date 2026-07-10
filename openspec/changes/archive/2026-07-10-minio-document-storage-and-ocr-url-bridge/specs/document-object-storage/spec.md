## ADDED Requirements

### Requirement: Safe MinIO configuration
The backend SHALL load MinIO connection settings from server-side environment variables and SHALL NOT expose raw storage credentials to the frontend.

#### Scenario: Backend reports storage configuration
- **WHEN** a client requests storage readiness metadata
- **THEN** the backend returns configured flags, bucket name, endpoint presence, and public endpoint presence without returning access keys or secret keys

### Requirement: Private document upload
The backend SHALL accept a multipart document upload and store the uploaded file in the configured private MinIO bucket.

#### Scenario: File is uploaded
- **WHEN** a client submits a multipart request containing a `file` field
- **THEN** the backend stores the file object and returns the object key, original filename, content type, file size, and bucket name

#### Scenario: Upload request is invalid
- **WHEN** a client submits an upload request without a file
- **THEN** the backend returns a validation error without creating an object

### Requirement: Presigned document access
The backend SHALL generate short-lived presigned download URLs for stored document objects.

#### Scenario: Presigned URL is requested
- **WHEN** a client requests a presigned URL for an object key
- **THEN** the backend returns a URL and expiration metadata without exposing storage credentials

### Requirement: Storage connectivity check
The backend SHALL provide a MinIO status endpoint that can verify bucket connectivity.

#### Scenario: Bucket is reachable
- **WHEN** the backend can access the configured bucket
- **THEN** the status endpoint returns an ok result with the configured bucket

#### Scenario: Bucket is not reachable
- **WHEN** the backend cannot access the configured bucket
- **THEN** the status endpoint returns a failed result with a non-secret diagnostic message
