export const isHorizontal = false

export const text = (context, text, x, y, fontSize, fontColor) => {
    context.font = `${fontSize} Arial`;
    context.fillStyle = fontColor;
    context.fillText(text, x, y);
};

export const wrapText = (context, text, x, y, maxWidth, fontSize, lineHeight, fontColor) => {
    context.fillStyle = fontColor;
    context.font = `${fontSize} Arial`;
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        let testLine = `${line + words[n]} `;
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = `${words[n]} `;
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
};

export const roundRect = (context, x, y, width, height, radius = 5, fill = false, stroke = true) => {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    context.beginPath();
    context.moveTo(x + radius.tl, y);
    context.lineTo(x + width - radius.tr, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    context.lineTo(x + width, y + height - radius.br);
    context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    context.lineTo(x + radius.bl, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    context.lineTo(x, y + radius.tl);
    context.quadraticCurveTo(x, y, x + radius.tl, y);
    context.closePath();
    if (fill) {
        context.fill();
    }
    if (stroke) {
        context.stroke();
    }
};

const appendFront0 = numStr => numStr.padStart(2, '0');

export const getColorStringFromCanvas = (context, xIndex, yIndex) => {
    const pixelData = context.getImageData(xIndex, yIndex, 1, 1).data;
    const [r, g, b] = pixelData;
    return `#${appendFront0(r.toString(16))}${appendFront0(g.toString(16))}${appendFront0(b.toString(16))}`;
};

export const randomColor = (): string => {
    const letters = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f'
    ]
    let color = '#'
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}
