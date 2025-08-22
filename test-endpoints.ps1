# Test key admin endpoints for 500 errors
$endpoints = @(
    "https://m2labs.com/api/admin/warranty",
    "https://m2labs.com/api/admin/support/tickets",
    "https://m2labs.com/api/admin/distributors",
    "https://m2labs.com/api/newsletter"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -ErrorAction Stop
        Write-Host "$endpoint : $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "$endpoint : $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
