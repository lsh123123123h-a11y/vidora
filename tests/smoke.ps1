param(
  [string]$BaseUrl = "http://127.0.0.1:10588"
)

Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Net.Http

$client = [System.Net.Http.HttpClient]::new()

function Invoke-VidoraRequest([string]$Method, [string]$Path, [string]$Body = "") {
  $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::$Method, "$BaseUrl$Path")
  if (-not [string]::IsNullOrEmpty($Body)) {
    $request.Content = [System.Net.Http.StringContent]::new($Body, [System.Text.Encoding]::UTF8, "application/json")
  }

  $response = $client.SendAsync($request).GetAwaiter().GetResult()
  return [PSCustomObject]@{
    Status = [int]$response.StatusCode
    Body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  }
}

try {
  $health = Invoke-VidoraRequest GET "/healthz"
  $page = Invoke-VidoraRequest GET "/"
  $invalidLogin = Invoke-VidoraRequest POST "/api/login/login" '{"username":"invalid","password":"invalid"}'
  $protected = Invoke-VidoraRequest GET "/api/setting/agentDeploy/getAgentDeploy"

  if ($health.Status -ne 200) { throw "/healthz returned $($health.Status)" }
  if ($page.Status -ne 200 -or $page.Body -notmatch "Vidora") { throw "homepage validation failed with status $($page.Status)" }
  if ($invalidLogin.Status -ge 500) { throw "invalid login returned $($invalidLogin.Status)" }
  if ($protected.Status -ne 401) { throw "protected route returned $($protected.Status), expected 401" }

  Write-Output "Vidora HTTP smoke test passed: health=$($health.Status), page=$($page.Status), invalidLogin=$($invalidLogin.Status), protected=$($protected.Status)"
} finally {
  $client.Dispose()
}
