/**
 * ParabolicMirrorSection.
 * Tools -> Mirror -> ParabolicMirrorSection
 * The current implementation is based on `CustomMirror.js`, but this should be changed to an analytical solution in the future.
 * @property {Point} p4 - distance to center (mirror radius)
 * @property {Point} p5 - The second endpoint.
 * @property {Point} p1 - mirror center
 * @property {Point} p2 - focus
 * @property {Point} p3 - y direction
 * @property {Number} dm - diameter of mirror perpendicular to incidence direction
 * @property {Number} df - focus distance
 * @property {Number} a - long axis
 * @property {Number} f - parental focal length
 * @property {Array<Number>} Dirx - perpendicular to direction 1
 * @property {Array<Number>} Diry - p3-p1 
 * @property {Point} Orig - cooridinate origine
 * @property {boolean} filter - Whether it is a dichroic mirror.
 * @property {boolean} invert - If true, the ray with wavelength outside the bandwidth is reflected. If false, the ray with wavelength inside the bandwidth is reflected.
 * @property {number} wavelength - The target wavelength if dichroic is enabled. The unit is nm.
 * @property {number} bandwidth - The bandwidth if dichroic is enabled. The unit is nm.
 * @property {Array<Point>} tmp_points - The points on the parabola.
 * @property {number} tmp_i - The index of the point on the parabola where the ray is incident.
 */
objTypes['OffaxisParabolicMirror'] = class extends BaseFilter {
  static type = 'OffaxisParabolicMirror';
  static isOptical = true;
  static serializableDefaults = {
    p1: null,
    p2: null,
    p3: null,
    p4: null,
    p5: null,
    filter: false,
    invert: false,
    wavelength: GREEN_WAVELENGTH,
    bandwidth: 10
  };

  draw(canvasRenderer, isAboveLight, isHovered) {
    const ctx = canvasRenderer.ctx;
    ctx.fillStyle = 'rgb(255,0,255)';
    if (this.p2 && this.p3) {
        
      var p13d = geometry.distance(this.p1, this.p3);
        
      // y direction: direction of light incidence 
      this.Diry = [(this.p1.x - this.p3.x)/p13d, (this.p1.y - this.p3.y)/p13d];
      this.Dirx = [this.Diry[1], -this.Diry[0]];
      
      //Origine (x0,y0) calculation -> got to local coordinates and set p2 = 0 for the start
      var yl2 = 0;
      var xl2 = 0;
      var xl0 = 0;
      var xl1 = (this.p1.x-this.p2.x)*this.Dirx[0]+(this.p1.y-this.p2.y)*this.Dirx[1];
      var yl1 = (this.p1.x-this.p2.x)*this.Diry[0]+(this.p1.y-this.p2.y)*this.Diry[1];
      var yl0 = 0.5*(Math.sqrt((xl0-xl1)*(xl0-xl1)+(yl1-yl2)*(yl1-yl2))+yl1+yl2);
      this.Orig = geometry.point(this.p2.x+this.Dirx[0] * xl0 + this.Diry[0] * yl0,this.p2.y + this.Dirx[1] * xl0 + this.Diry[1] * yl0);
      
      this.p5 = this.Orig;
      this.f = geometry.distance(this.p2,this.Orig);      
      this.a = 1/(4*this.f);
      
      if(!this.p4){
        //define p4 after construction of p1, p2, and p3
        this.dm = this.f/2;
        var xl4 = xl1-this.dm;
        var yl4 = -xl4*xl4/(4*this.f);
        this.p4 = geometry.point(this.Orig.x+this.Dirx[0] * xl4 + this.Diry[0] * yl4,this.Orig.y + this.Dirx[1] * xl4 + this.Diry[1] * yl4);
      }
      
      
      var i;
      var xstart = this.dm>0 ? xl1-this.dm : xl1+this.dm;
      var xend = this.dm<0 ? xl1-this.dm : xl1+this.dm;
      var ystart = -xstart*xstart/(4*this.f);
      var firstpoint = geometry.point(this.Orig.x + this.Dirx[0] * xstart + this.Diry[0] * ystart, this.Orig.y + this.Dirx[1] * xstart + this.Diry[1] * ystart);
      ctx.strokeStyle = isHovered ? 'cyan' : ((scene.simulateColors && this.wavelength && this.filter) ? wavelengthToColor(this.wavelength || GREEN_WAVELENGTH, 1) : 'rgb(168,168,168)');
      ctx.beginPath();
      this.tmp_points = [firstpoint];
      ctx.moveTo(firstpoint.x, firstpoint.y);

      for (i = xstart; i <= xend; i+=0.1){
        // avoid using exact integers to avoid problems with detecting intersections
        var ix = i + .001;
        var x = ix;
        var y = -ix*ix/(4*this.f);
        //console.log(y)
        var pt = geometry.point(this.Orig.x + this.Dirx[0] * x + this.Diry[0] * y, this.Orig.y + this.Dirx[1] * x + this.Diry[1] * y);
        ctx.lineTo(pt.x, pt.y);
        this.tmp_points.push(pt);
      }
      ctx.stroke();
     if (isHovered) {
        ctx.fillStyle = 'rgb(255,0,0)';
        ctx.fillRect(this.p1.x - 1.5, this.p1.y - 1.5, 3, 3);
        ctx.fillRect(this.p3.x - 1.5, this.p3.y - 1.5, 3, 3);
        ctx.fillRect(this.p4.x - 1.5, this.p4.y - 1.5, 3, 3);
        ctx.fillRect(this.p2.x - 1.5, this.p2.y - 1.5, 3, 3);
        ctx.fillStyle = 'rgb(180,180,180)';      
        ctx.fillRect(this.p5.x - 1.5, this.p5.y - 1.5, 3, 3);  
        
      }
    } else if (this.p2) {
      ctx.fillStyle = 'rgb(255,0,0)';
      ctx.fillRect(this.p1.x - 1.5, this.p1.y - 1.5, 3, 3);
      ctx.fillRect(this.p2.x - 1.5, this.p2.y - 1.5, 3, 3);
    } else {
      ctx.fillStyle = 'rgb(255,0,0)';
      ctx.fillRect(this.p1.x - 1.5, this.p1.y - 1.5, 3, 3);
    }
  }
  updateDir(){
     // update direction
     var p13d = geometry.distance(this.p1, this.p3);
     this.Diry = [(this.p1.x - this.p3.x)/p13d, (this.p1.y - this.p3.y)/p13d];
     this.Dirx = [this.Diry[1], -this.Diry[0]];
  }
  updateOrig(){
    var yl2 = 0;
    var xl0 = 0;
    var xl1 = (this.p1.x-this.p2.x)*this.Dirx[0]+(this.p1.y-this.p2.y)*this.Dirx[1];
    var yl1 = (this.p1.x-this.p2.x)*this.Diry[0]+(this.p1.y-this.p2.y)*this.Diry[1];
    var yl0 = 0.5*(Math.sqrt((xl0-xl1)*(xl0-xl1)+(yl1-yl2)*(yl1-yl2))+yl1+yl2);
    this.Orig = geometry.point(this.p2.x+this.Dirx[0] * xl0 + this.Diry[0] * yl0,this.p2.y + this.Dirx[1] * xl0 + this.Diry[1] * yl0);
  }
  move(diffX, diffY) {
    this.p1.x = this.p1.x + diffX;
    this.p1.y = this.p1.y + diffY;
    this.p2.x = this.p2.x + diffX;
    this.p2.y = this.p2.y + diffY;
    this.p3.x = this.p3.x + diffX;
    this.p3.y = this.p3.y + diffY;
    this.p4.x = this.p4.x + diffX;
    this.p4.y = this.p4.y + diffY;
    this.p5.x = this.p5.x + diffX;
    this.p5.y = this.p5.y + diffY;
  }

  onConstructMouseDown(mouse, ctrl, shift) {
    if (!this.constructionPoint) {
      // Initialize the construction stage.
      this.constructionPoint = mouse.getPosSnappedToGrid();
      this.p1 = this.constructionPoint;
      this.p2 = null;
      this.p3 = null;
      this.p4 = null;
      this.p5 = null;
    }
   //set focus point (p2)
    if (!this.p2 && !this.p3) {
      this.p2 = mouse.getPosSnappedToGrid();
      return;
    }
    //moving p2 or making p3
    if (this.p2 && !this.p3 && !mouse.isOnPoint(this.p1)) {
      if (shift) {
        this.p2 = mouse.getPosSnappedToDirection(this.p1, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: -1 }]);
      } else {
        this.p2 = mouse.getPosSnappedToGrid();
      }
      this.p3 = mouse.getPosSnappedToGrid();
      return;
    }
  }

  onConstructMouseMove(mouse, ctrl, shift) {
    if (!this.p3 && !mouse.isOnPoint(this.p1)) {
      if (shift) {
        this.p2 = mouse.getPosSnappedToDirection(this.constructionPoint, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: -1 }]);
      } else {
        this.p2 = mouse.getPosSnappedToGrid();
      }

      //this.p1 = this.constructionPoint;

      return;
    }
    if (this.p3) {
      var basePoint = this.p1;
      this.p3 = shift ? mouse.getPosSnappedToDirection(basePoint, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: -1 }]) : mouse.getPosSnappedToGrid();
      
      //reset point 4
      this.updateDir(); 
      this.updateOrig(); 
      var xl1 = (this.p1.x-this.p2.x)*this.Dirx[0]+(this.p1.y-this.p2.y)*this.Dirx[1];
      var xstart = xl1-this.dm;
      var ystart = -xstart*xstart/(4*this.f);
      this.p4 = geometry.point(this.Orig.x + this.Dirx[0] * xstart + this.Diry[0] * ystart, this.Orig.y + this.Dirx[1] * xstart + this.Diry[1] * ystart);
    
      return;
    }
  }

  onConstructMouseUp(mouse, ctrl, shift) {
    if (this.p1 && !this.p2 && !this.p3 && !this.p4 && !this.p5 && !mouse.isOnPoint(this.p1)) {
        this.p2 = mouse.getPosSnappedToGrid();
        return;
      }
    if (this.p2 && !this.p3 && !this.p4 && !this.p5 && !mouse.isOnPoint(this.p1)) {
      this.p3 = mouse.getPosSnappedToGrid();
      return;
    }
    if (this.p3 && !mouse.isOnPoint(this.p2)) {
      this.p3 = mouse.getPosSnappedToGrid();
      delete this.constructionPoint;
      return {
        isDone: true
      };
    }
  }

  checkMouseOver(mouse) {
    let dragContext = {};
    if (mouse.isOnPoint(this.p1) && geometry.distanceSquared(mouse.pos, this.p1) <= geometry.distanceSquared(mouse.pos, this.p2) && geometry.distanceSquared(mouse.pos, this.p1) <= geometry.distanceSquared(mouse.pos, this.p3)) {
      dragContext.part = 1;
      dragContext.targetPoint = geometry.point(this.p1.x, this.p1.y);
      dragContext.mousePos1 = mouse.getPosSnappedToGrid();
      return dragContext;
    }
    if (this.p2 && mouse.isOnPoint(this.p2) && geometry.distanceSquared(mouse.pos, this.p2) <= geometry.distanceSquared(mouse.pos, this.p3)) {
      dragContext.part = 2;
      dragContext.targetPoint = geometry.point(this.p2.x, this.p2.y);
      return dragContext;
    }
    if (this.p3 && mouse.isOnPoint(this.p3)) {
      dragContext.part = 3;
      dragContext.targetPoint = geometry.point(this.p3.x, this.p3.y);
      return dragContext;
    }
    if (this.p3 && mouse.isOnPoint(this.p4)) {
        dragContext.part = 4;
        dragContext.targetPoint = geometry.point(this.p4.x, this.p4.y);
        return dragContext;
    }
    
    if (!this.tmp_points) return;
    var i;
    var pts = this.tmp_points;
    for (i = 0; i < pts.length - 1; i++) {
      var seg = geometry.line(pts[i], pts[i + 1]);
      if (mouse.isOnSegment(seg)) {
        const mousePos = mouse.getPosSnappedToGrid();
        dragContext.part = 0;
        dragContext.mousePos0 = mousePos;
        dragContext.mousePos1 = mousePos;
        dragContext.snapContext = {};
        return dragContext;
      }
    }
  }
    
  onDrag(mouse, dragContext, ctrl, shift) {
    var basePoint;
    var dx;
    var dy;
    var dxl;
    var dyl;
    if (dragContext.part == 1) {
      // Dragging the mirror center
      
      var basePoint3 = dragContext.originalObj.p3;
      var basePoint2 = dragContext.originalObj.p2;
      var mousePos = mouse.getPosSnappedToGrid();
      //dxl = (dragContext.mousePos1.x - mousePos.x)*this.Dirx[0]+(dragContext.targetPoint.y - mousePos.y)*this.Dirx[1]; // The X difference between the mouse position now and at the previous moment in Dirx
      //dyl = (dragContext.mousePos1.x - mousePos.x)*this.Diry[0]+(dragContext.targetPoint.y - mousePos.y)*this.Diry[1]; // The X difference between the mouse position now and at the previous moment in Dirx
      dy = dragContext.mousePos1.y - mousePos.y; // The Y difference between the mouse position now and at the previous moment in Diry
      dx = dragContext.mousePos1.x - mousePos.x; // The Y difference between the mouse position now and at the previous moment in Diry
      
      this.p1 = shift ? mouse.getPosSnappedToDirection(basePoint2, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: -1 }, { x: (dragContext.originalObj.p2.x - dragContext.originalObj.p1.x), y: (dragContext.originalObj.p2.y - dragContext.originalObj.p1.y) }]) : mouse.getPosSnappedToGrid();
      //ctrl -> keep input direction constant
      this.p3 = ctrl ? geometry.point(basePoint3.x - dx, basePoint3.y-dy) : basePoint3;
      
      //reset p4    
      this.updateDir(); 
      this.updateOrig(); 
      var xl1 = (this.p1.x-this.p2.x)*this.Dirx[0]+(this.p1.y-this.p2.y)*this.Dirx[1];
      var xstart = xl1-this.dm;
      var ystart = -xstart*xstart/(4*this.f);
      this.p4 = geometry.point(this.Orig.x + this.Dirx[0] * xstart + this.Diry[0] * ystart, this.Orig.y + this.Dirx[1] * xstart + this.Diry[1] * ystart);
    
    }
    if (dragContext.part == 2) {
      // Dragging the focal point
      basePoint = ctrl ? geometry.segmentMidpoint(dragContext.originalObj) : dragContext.originalObj.p1;
      this.p2 = shift ? mouse.getPosSnappedToDirection(basePoint, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: -1 }, { x: (dragContext.originalObj.p2.x - dragContext.originalObj.p1.x), y: (dragContext.originalObj.p2.y - dragContext.originalObj.p1.y) }]) : mouse.getPosSnappedToGrid();
      
      //reset p4      
      this.updateOrig();
      var xl1 = (this.p1.x-this.p2.x)*this.Dirx[0]+(this.p1.y-this.p2.y)*this.Dirx[1];
      var xstart = xl1-this.dm;
      var ystart = -xstart*xstart/(4*this.f);
      this.p4 = geometry.point(this.Orig.x + this.Dirx[0] * xstart + this.Diry[0] * ystart, this.Orig.y + this.Dirx[1] * xstart + this.Diry[1] * ystart);
    }
    if (dragContext.part == 3) {
      // Dragging direction
      basePoint = dragContext.originalObj.p1;
      this.p3 = shift ? mouse.getPosSnappedToDirection(basePoint, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: -1 }]) : mouse.getPosSnappedToGrid();
      
      this.updateDir();
      this.updateOrig();

      //reset p4      
      var xl1 = (this.p1.x-this.p2.x)*this.Dirx[0]+(this.p1.y-this.p2.y)*this.Dirx[1];
      var xstart = xl1-this.dm;
      var ystart = -xstart*xstart/(4*this.f);
      this.p4 = geometry.point(this.Orig.x + this.Dirx[0] * xstart + this.Diry[0] * ystart, this.Orig.y + this.Dirx[1] * xstart + this.Diry[1] * ystart);
    
    }
    if (dragContext.part == 4) {
        // Dragging the mirror end point -> mirror diameter
      var newxl4 = (mouse.getPosSnappedToGrid().x-this.Orig.x)*this.Dirx[0]+(mouse.getPosSnappedToGrid().y-this.Orig.y)*this.Dirx[1];
      var newyl4 = -newxl4*newxl4/(4*this.f);
      var xl1 = (this.p1.x-this.p2.x)*this.Dirx[0]+(this.p1.y-this.p2.y)*this.Dirx[1];
      this.dm = xl1-newxl4;
      //console.log(y)
      var pt = geometry.point(this.Orig.x + this.Dirx[0] * newxl4 + this.Diry[0] * newyl4, this.Orig.y + this.Dirx[1] * newxl4 + this.Diry[1] * newyl4);
      
        this.p4 = pt;
    }
    if (dragContext.part == 0) {
      // Dragging the entire obj
      if (shift) {
        var mousePos = mouse.getPosSnappedToDirection(dragContext.mousePos0, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: (dragContext.originalObj.p2.x - dragContext.originalObj.p1.x), y: (dragContext.originalObj.p2.y - dragContext.originalObj.p1.y) }, { x: (dragContext.originalObj.p2.y - dragContext.originalObj.p1.y), y: -(dragContext.originalObj.p2.x - dragContext.originalObj.p1.x) }], dragContext.snapContext);
      } else {
        var mousePos = mouse.getPosSnappedToGrid();
        dragContext.snapContext = {}; // Unlock the dragging direction when the user release the shift key
      }
      var mouseDiffX = dragContext.mousePos1.x - mousePos.x; // The X difference between the mouse position now and at the previous moment
      var mouseDiffY = dragContext.mousePos1.y - mousePos.y; // The Y difference between the mouse position now and at the previous moment
      
      // Move the first point
      this.p1.x = this.p1.x - mouseDiffX;
      this.p1.y = this.p1.y - mouseDiffY;
      // Move the second point
      this.p2.x = this.p2.x - mouseDiffX;
      this.p2.y = this.p2.y - mouseDiffY;

      this.p3.x = this.p3.x - mouseDiffX;
      this.p3.y = this.p3.y - mouseDiffY;
      
      this.p4.x = this.p4.x - mouseDiffX;
      this.p4.y = this.p4.y - mouseDiffY;
      
      this.p5.x = this.p5.x - mouseDiffX;
      this.p5.y = this.p5.y - mouseDiffY;

      // Update the mouse position
      dragContext.mousePos1 = mousePos;
    }
  }

  checkRayIntersects(ray) {
    if (!this.p3) { return; }
    if (!this.p4) { return; }
    if (!this.p5) { return; }
    if (!this.tmp_points || !this.checkRayIntersectFilter(ray)) return;
    var i, j;
    var pts = this.tmp_points;
    var dir = geometry.distance(this.p2, ray.p1) > geometry.distance(this.p1, ray.p1);
    var incidentPoint;
    for (j = 0; j < pts.length - 1; j++) {
      i = dir ? j : (pts.length - 2 - j);
      var rp_temp = geometry.linesIntersection(geometry.line(ray.p1, ray.p2), geometry.line(pts[i], pts[i + 1]));
      var seg = geometry.line(pts[i], pts[i + 1]);
      // need minShotLength check to handle a ray that reflects off mirror multiple times
      if (geometry.distance(ray.p1, rp_temp) < minShotLength)
        continue;
      if (geometry.intersectionIsOnSegment(rp_temp, seg) && geometry.intersectionIsOnRay(rp_temp, ray)) {
        if (!incidentPoint || geometry.distance(ray.p1, rp_temp) < geometry.distance(ray.p1, incidentPoint)) {
          incidentPoint = rp_temp;
          this.tmp_i = i;
        }
      }
    }
    if (incidentPoint) return incidentPoint;
  }

  onRayIncident(ray, rayIndex, incidentPoint) {
    var rx = ray.p1.x - incidentPoint.x;
    var ry = ray.p1.y - incidentPoint.y;
    var i = this.tmp_i;
    var pts = this.tmp_points;
    var seg = geometry.line(pts[i], pts[i + 1]);
    var mx = seg.p2.x - seg.p1.x;
    var my = seg.p2.y - seg.p1.y;


    ray.p1 = incidentPoint;
    var frac;
    if (Math.abs(mx) > Math.abs(my)) {
      frac = (incidentPoint.x - seg.p1.x) / mx;
    } else {
      frac = (incidentPoint.y - seg.p1.y) / my;
    }

    if ((i == 0 && frac < 0.5) || (i == pts.length - 2 && frac >= 0.5)) {
      ray.p2 = geometry.point(incidentPoint.x + rx * (my * my - mx * mx) - 2 * ry * mx * my, incidentPoint.y + ry * (mx * mx - my * my) - 2 * rx * mx * my);
    } else {
      // Use a simple trick to smooth out the slopes of outgoing rays so that image detection works.
      // However, a more proper numerical algorithm from the beginning (especially to handle singularities) is still desired.

      var outx = incidentPoint.x + rx * (my * my - mx * mx) - 2 * ry * mx * my;
      var outy = incidentPoint.y + ry * (mx * mx - my * my) - 2 * rx * mx * my;

      var segA;
      if (frac < 0.5) {
        segA = geometry.line(pts[i - 1], pts[i]);
      } else {
        segA = geometry.line(pts[i + 1], pts[i + 2]);
      }
      var rxA = ray.p1.x - incidentPoint.x;
      var ryA = ray.p1.y - incidentPoint.y;
      var mxA = segA.p2.x - segA.p1.x;
      var myA = segA.p2.y - segA.p1.y;

      var outxA = incidentPoint.x + rxA * (myA * myA - mxA * mxA) - 2 * ryA * mxA * myA;
      var outyA = incidentPoint.y + ryA * (mxA * mxA - myA * myA) - 2 * rxA * mxA * myA;

      var outxFinal;
      var outyFinal;

      if (frac < 0.5) {
        outxFinal = outx * (0.5 + frac) + outxA * (0.5 - frac);
        outyFinal = outy * (0.5 + frac) + outyA * (0.5 - frac);
      } else {
        outxFinal = outxA * (frac - 0.5) + outx * (1.5 - frac);
        outyFinal = outyA * (frac - 0.5) + outy * (1.5 - frac);
      }
      //console.log(frac);
      ray.p2 = geometry.point(outxFinal, outyFinal);
    }
  }
};
