Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot "..\assets\logo.png"
$dest = Join-Path $PSScriptRoot "..\assets\favicon.png"

$img = [System.Drawing.Image]::FromFile($src)
try {
  $size = [Math]::Min($img.Width, $img.Height)
  $cropSize = [int]($size * 0.42)
  $x = [int](($img.Width - $cropSize) / 2)
  $y = [int](($img.Height - $cropSize) / 2)

  $crop = New-Object System.Drawing.Bitmap $cropSize, $cropSize
  $g = [System.Drawing.Graphics]::FromImage($crop)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, (New-Object System.Drawing.Rectangle $x, $y, $cropSize, $cropSize), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()

  $favicon = New-Object System.Drawing.Bitmap 32, 32
  $g2 = [System.Drawing.Graphics]::FromImage($favicon)
  $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g2.Clear([System.Drawing.Color]::FromArgb(248, 250, 244))
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255))
  $g2.FillEllipse($brush, 1, 1, 30, 30)
  $brush.Dispose()
  $g2.DrawImage($crop, 2, 2, 28, 28)
  $g2.Dispose()
  $crop.Dispose()

  $favicon.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $favicon.Dispose()
  Write-Output "Created $dest"
}
finally {
  $img.Dispose()
}
