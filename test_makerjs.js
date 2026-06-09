import DxfWriter from 'dxf-writer';
const dxf = new DxfWriter();
dxf.addLayer('TEST', DxfWriter.ACI.WHITE, 'CONTINUOUS');
dxf.drawArc(0, 0, 10, 0, 90, 'TEST');
console.log(dxf.toDxfString().slice(-200));
