 class Path {
    constructor() {
        this.radius = 20;
        this.points = [];
    }

    addPoint(x, y) {
        let point = createVector(x, y);
        this.points.push(point);
    }

    // A path is only two points involved in the steering behavior
    // But we can have a path with multiple points

    // Draw the path
    show() {
        stroke(255, 100);
        strokeWeight(this.radius * 2);
        noFill();
        beginShape();
        for (let v of this.points) {
            vertex(v.x, v.y);
        }
        endShape();

        stroke(255);
        strokeWeight(1);
        noFill();
        beginShape();
        for (let v of this.points) {
            vertex(v.x, v.y);
        }
        endShape();
    }
}
