# Load environment variables from .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $name = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "Environment variables loaded from .env file"
} else {
    Write-Host "Warning: .env file not found. Please create one with AUTH0_AUDIENCE, AUTH0_DOMAIN, AUTH0_CLIENT_ID"
}

# Start the Angular development server
ng serve --project=planza
