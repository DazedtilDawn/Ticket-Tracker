<#
  setup-git-cursor.ps1  –  keep Cursor (or VS Code) always rebased on origin/main
  ▸ sets branch tracking + safe defaults
  ▸ adds `git up`  (fast-forward rebase)  and  `git sync` (stash-and-rebase)
  ▸ turns on auto-fetch every 5 min in Cursor / VS Code

  Usage:
      PS> iwr https://gist.githubusercontent.com/…/setup-git-cursor.ps1 -OutFile setup.ps1
      PS> .\setup.ps1 -RepoPath "C:\src\Ticket-Tracker"
#>

param(
  [string]$RepoPath = "."
)

function Ensure-InRepo {
  Set-Location $RepoPath
  if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
    throw "❌  '$RepoPath' is not a git repository."
  }
}

function Configure-BranchTracking {
  git fetch origin --prune
  # if main already exists, just switch to it; otherwise create from origin/main
  if (git show-ref --quiet refs/heads/main) {
    git checkout main
  } else {
    git checkout -b main origin/main
  }
  git branch --set-upstream-to=origin/main main
}

function Set-GlobalGitPrefs {
  git config --global fetch.prune      true
  git config --global pull.ff          only
  git config --global alias.up   '!git fetch origin main --prune && git rebase origin/main'
  git config --global alias.sync '!git add -A         && git up'
}

function Enable-AutoFetch {
  $settingsPath = Join-Path $env:APPDATA "Code\User\settings.json"   # Cursor uses same path
  if (-not (Test-Path $settingsPath)) {
    New-Item -Path $settingsPath -ItemType File -Force | Out-Null
    $settings = @{}
  } else {
    try   { $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable }
    catch { $settings = @{} }   # malformed JSON → start fresh
  }

  $settings["git.autofetch"]       = $true
  $settings["git.autofetchPeriod"] = 300000   # 5 min in ms

  $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding utf8
  Write-Host "🛠️  Updated $settingsPath with auto-fetch settings"
}

# ---------------- main flow ----------------
Ensure-InRepo
Write-Host "✅ In repo: $RepoPath`n"

Write-Host "🔄  Setting branch <main> to track origin/main..."
Configure-BranchTracking

Write-Host "⚙️   Applying global git defaults & aliases..."
Set-GlobalGitPrefs

Write-Host "🔧  Enabling auto-fetch in Cursor / VS Code..."
Enable-AutoFetch

Write-Host "`n🎉  Done!  Use  git up  (clean tree) or  git sync  (with changes) before letting Cursor edit."
