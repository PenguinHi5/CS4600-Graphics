// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
    // Foreground borders
    var maxX = fgImg.width + fgPos.x - 1;
    var minX = Math.max(fgPos.x, 0);
    var maxY = fgImg.height + fgPos.y - 1;
    var minY = Math.max(fgPos.y, 0);
    
    for (var i = 0; i < bgImg.data.length / 4; i++)
    {
        // Background pixel x and y pos
        var xB = i % bgImg.width;
        var yB = Math.floor(i / bgImg.width);

        // Foreground pixel x and y pos
        var xF = xB - fgPos.x;
        var yF = yB - fgPos.y;
        // Calculates fgImg's equivalent to i (the pixel overlapping bgImg's i pixel)
        var iF = yF * fgImg.width + xF;
        
        // If pixel doesn't overlap the foreground image
        if (xB > maxX || xB < minX || yB > maxY || yB < minY)
        {
            continue;
        }

        // RGB values are 0 to 1
        var rF = fgImg.data[iF * 4 + 0] / 255.0;
        var gF = fgImg.data[iF * 4 + 1] / 255.0;
        var bF = fgImg.data[iF * 4 + 2] / 255.0;
        var aF = (fgImg.data[iF * 4 + 3] / 255.0) * fgOpac;

        var rB = bgImg.data[i * 4 + 0] / 255.0;
        var gB = bgImg.data[i * 4 + 1] / 255.0;
        var bB = bgImg.data[i * 4 + 2] / 255.0;
        var aB = bgImg.data[i * 4 + 3] / 255.0;

        var alpha = aF + (1 - aF) * aB;

        // Gets the first R(GBA) position of the foreground pixel overlapping the current background pixel
        bgImg.data[i * 4 + 0] = ((aF * rF + (1 - aF) * aB * rB) / alpha) * 255; // R
        bgImg.data[i * 4 + 1] = ((aF * gF + (1 - aF) * aB * gB) / alpha) * 255; // G
        bgImg.data[i * 4 + 2] = ((aF * bF + (1 - aF) * aB * bB) / alpha) * 255; // B
        bgImg.data[i * 4 + 3] = alpha * 255; // A
    }
}
