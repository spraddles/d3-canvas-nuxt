import * as d3 from 'd3'
import { roundRect, wrapText, getColorStringFromCanvas, randomColor, isHorizontal } from '../utils'
import { customStep } from './customStep'

export class d3Chart {
    d3: any
    // dimensions
    width: number
    height: number
    padding: number
    nodeHeight: number
    nodeWidth: number
    unitPadding: number
    unitWidth: number
    unitHeight: number
    duration: number
    scale: number
    // tree
    data: any
    treeGenerator: any
    treeData: any
    virtualContainerNode: any
    container: any
    canvasNode: any
    hiddenCanvasNode: any
    context: any
    hiddenContext: any
    colorNodeMap: {}
    // drag
    mouseDown: boolean
    mouseMove: boolean
    mouseOut: boolean
    mouseUp: boolean
    onDrag_: boolean
    dragStartPoint_: { x: number; y: number }

    constructor() {
        this.d3 = d3
        this.init()
    }

    init() {
        this.initVariables()
        this.initCanvas()
        this.initVirtualNode()
        this.setCanvasListener()
    }

    initVariables() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.padding = 20
        // tree node size
        this.nodeWidth = 500
        this.nodeHeight = 150
        // box unit size
        this.unitPadding = 20
        this.unitWidth = 200
        this.unitHeight = 100
        // animation duration
        this.duration = 600
        this.scale = 1.0
        // drag
        this.mouseDown = false
        this.mouseMove = false
        this.mouseOut = false
        this.mouseUp = false
    }

    draw(data) {
        this.data = this.d3.hierarchy(data)
        this.collapseNodes(this.data);
        this.treeGenerator =
            this.d3
                .tree()
                .nodeSize([this.nodeHeight, this.nodeWidth])
        this.update(null)
        const self = this
        this.d3.timer(function () {
            self.drawCanvas()
        })
    }

    collapseNodes(node, depth = 0) {
        if (node.children) {
            if (depth >= 1) {
                node._children = node.children;
                node.children = null;
            } else {
                node.children.forEach(child => this.collapseNodes(child, depth + 1));
            }
        }
    }

    update(node) {
        this.treeData = this.treeGenerator(this.data);
        const boxes = this.treeData.descendants()
        const links = this.treeData.links().filter(l => l.source.depth <= 2); // only expand one level at a time

        let animatedStartX = 0
        let animatedStartY = 0
        let animatedEndX = 0
        let animatedEndY = 0

        if (node) {
            animatedStartX = isHorizontal ? node.x0 : node.y0
            animatedStartY = isHorizontal ? node.y0 : node.x0
            animatedEndX = isHorizontal ? node.x : node.y
            animatedEndY = isHorizontal ? node.y : node.x
        }

        this.updateBoxes(
            boxes,
            animatedStartX,
            animatedStartY,
            animatedEndX,
            animatedEndY
        )

        this.updateLines(
            links,
            animatedStartX,
            animatedStartY,
            animatedEndX,
            animatedEndY
        )

        this.addColorKey()
        this.bindNodeToTreeData()
    }

    updateBoxes(
        boxes,
        animatedStartX,
        animatedStartY,
        animatedEndX,
        animatedEndY
    ) {
        let allBoxes = this.virtualContainerNode
            .selectAll('.box')
            .data(boxes, (d) => d['colorKey'])

        allBoxes
            .attr('class', 'box')
            .attr('x', function (data) { return !isHorizontal ? data.x0 : data.y0 }) // weird fix
            .attr('y', function (data) { return !isHorizontal ? data.y0 : data.x0 }) // weird fix
            .transition()
            .duration(this.duration)
            .attr('x', function (data) { return isHorizontal ? data.x : data.y })
            .attr('y', function (data) { return isHorizontal ? data.y : data.x })

        allBoxes
            .enter()
            .append('box')
            .attr('class', 'box')
            .attr('x', isHorizontal ? animatedStartX : animatedStartY)
            .attr('y', isHorizontal ? animatedStartY : animatedStartX)
            .transition()
            .duration(this.duration)
            .attr('x', function (data) { return isHorizontal ? data.x : data.y })
            .attr('y', function (data) { return isHorizontal ? data.y : data.x })

        allBoxes
            .exit()
            .transition()
            .duration(this.duration)
            .attr('x', !isHorizontal ? animatedEndX : animatedEndY) // weird fix
            .attr('y', !isHorizontal ? animatedEndY : animatedEndX) // weird fix
            .remove()

        // record origin index for animation
        boxes.forEach((box) => {
            box['x0'] = isHorizontal ? box.x : box.y
            box['y0'] = isHorizontal ? box.y : box.x
        })

        allBoxes = null
    }

    updateLines(
        links,
        animatedStartX,
        animatedStartY,
        animatedEndX,
        animatedEndY
    ) {
        let allLinks = this.virtualContainerNode
            .selectAll('.link')
            .data(links, function (d) {
                return d.source['colorKey'] + ':' + d.target['colorKey']
            })

        allLinks
            .attr('class', 'link')
            .attr('sourceX', function (link) { return !isHorizontal ? link.source['x00'] : link.source['y00'] }) // weird fix
            .attr('sourceY', function (link) { return !isHorizontal ? link.source['y00'] : link.source['x00'] }) // weird fix
            .attr('targetX', function (link) { return !isHorizontal ? link.target['x00'] : link.target['y00'] }) // weird fix
            .attr('targetY', function (link) { return !isHorizontal ? link.target['y00'] : link.target['x00'] }) // weird fix
            .transition()
            .duration(this.duration)
            .attr('sourceX', function (link) { return isHorizontal ? link.source.x : link.source.y })
            .attr('sourceY', function (link) { return isHorizontal ? link.source.y : link.source.x })
            .attr('targetX', function (link) { return isHorizontal ? link.target.x : link.target.y })
            .attr('targetY', function (link) { return isHorizontal ? link.target.y : link.target.x })

        allLinks
            .enter()
            .append('link')
            .attr('class', 'link')
            .attr('sourceX', isHorizontal ? animatedStartX : animatedStartY)
            .attr('sourceY', isHorizontal ? animatedStartY : animatedStartX)
            .attr('targetX', isHorizontal ? animatedStartX : animatedStartY)
            .attr('targetY', isHorizontal ? animatedStartY : animatedStartX)
            .transition()
            .duration(this.duration)
            .attr('sourceX', function (link) { return isHorizontal ? link.source.x : link.source.y })
            .attr('sourceY', function (link) { return isHorizontal ? link.source.y : link.source.x })
            .attr('targetX', function (link) { return isHorizontal ? link.target.x : link.target.y })
            .attr('targetY', function (link) { return isHorizontal ? link.target.y : link.target.x })

        allLinks
            .exit()
            .transition()
            .duration(this.duration)
            .attr('sourceX', !isHorizontal ? animatedEndX : animatedEndY) // weird fix
            .attr('sourceY', !isHorizontal ? animatedEndY : animatedEndX) // weird fix
            .attr('targetX', !isHorizontal ? animatedEndX : animatedEndY) // weird fix
            .attr('targetY', !isHorizontal ? animatedEndY : animatedEndX) // weird fix
            .remove()

        // record origin data for animation
        links.forEach((link) => {
            link.source['x00'] = isHorizontal ? link.source.x : link.source.y
            link.source['y00'] = isHorizontal ? link.source.y : link.source.x
            link.target['x00'] = isHorizontal ? link.target.x : link.target.y
            link.target['y00'] = isHorizontal ? link.target.y : link.target.x
        })
        allLinks = null
    }

    initCanvas() {
        this.container = this.d3.select('#d3-chart-container')
        const dpr = window.devicePixelRatio || 1;

        this.canvasNode = this.container
            .append('canvas')
            .attr('class', 'orgChart')
            .attr('width', this.width * dpr)
            .attr('height', this.height * dpr)
            .style('width', `${this.width}px`)
            .style('height', `${this.height}px`)

        this.hiddenCanvasNode = this.container
            .append('canvas')
            .attr('class', 'orgChart hidden')
            .attr('width', this.width * dpr)
            .attr('height', this.height * dpr)
            .style('width', `${this.width}px`)
            .style('height', `${this.height}px`)
            .style('display', '')

        this.context = this.canvasNode.node().getContext('2d')
        this.context.scale(dpr, dpr)
        this.context.translate(this.width / 2, this.padding)

        this.hiddenContext = this.hiddenCanvasNode.node().getContext('2d')
        this.hiddenContext.scale(dpr, dpr)
        this.hiddenContext.translate(this.width / 2, this.padding)
    }

    initVirtualNode() {
        let virtualContainer = document.createElement('root')
        this.virtualContainerNode = this.d3.select(virtualContainer)
        this.colorNodeMap = {}
    }

    addColorKey() {
        // give each node a unique color
        const self = this
        this.virtualContainerNode.selectAll('.box').each(function () {
            const node = self.d3.select(this)
            let newColor = randomColor()
            while (self.colorNodeMap[newColor]) {
                newColor = randomColor()
            }
            node.attr('colorKey', newColor)
            node.data()[0]['colorKey'] = newColor
            self.colorNodeMap[newColor] = node
        })
    }

    bindNodeToTreeData() {
        const self = this
        this.virtualContainerNode.selectAll('.box').each(function () {
            const node = self.d3.select(this)
            const data = node.data()[0]
            data.node = node
        })
    }

    drawCanvas() {
        this.clearCanvas_()
        this.drawShowCanvas()
        this.drawHiddenCanvas()
    }

    drawShowCanvas() {
        this.context.clearRect(-this.width / 2, -this.padding, this.width, this.height)
        const self = this
        // draw links
        this.virtualContainerNode.selectAll('.link').each(function () {
            const node = self.d3.select(this)
            const sourceX = +node.attr('sourceX')
            const sourceY = +node.attr('sourceY')
            const targetX = +node.attr('targetX')
            const targetY = +node.attr('targetY')
            const linkPath = d3.line()
                .x(d => d[0])
                .y(d => d[1])
                .curve(customStep(30))
                ([
                    [sourceX, sourceY],
                    [(sourceX + targetX) / 2, sourceY],
                    [(sourceX + targetX) / 2, targetY],
                    [targetX, targetY]
                ])
            const path = new Path2D(linkPath)
            self.context.stroke(path)
            self.context.strokeStyle = '#B3B3B3'
            self.context.lineWidth = 3
        })
        // draw boxes
        this.virtualContainerNode.selectAll('.box').each(function () {
            const node = self.d3.select(this)
            const treeNode = node.data()[0]
            const data = treeNode.data
            self.context.fillStyle = '#FFFFFF'
            const indexX = Number(node.attr('x')) - self.unitWidth / 2
            const indexY = Number(node.attr('y')) - self.unitHeight / 2

            /*
            ** Note: the 'roundRect' draws the box outline which 
            ** needs to appear in both shown + hidden canvases. 
            ** Whatever is changed in this shape needs to also be 
            ** replicated in the 'drawHiddenCanvas' so the x + y 
            ** positions can be calculated.
            */

            roundRect(
                self.context,
                indexX,
                indexY,
                self.unitWidth,
                self.unitHeight,
                20,
                true,
                false
            )

            wrapText(
                self.context,
                data.name,
                indexX + self.unitPadding,
                indexY + self.unitPadding + 10,
                self.unitWidth - 2 * self.unitPadding,
                '14px', // font size
                20, // line height
                '#000000'
            )
        })
    }

    drawHiddenCanvas() {
        this.hiddenContext.clearRect(-this.width / 2, -this.padding, this.width, this.height)
        const self = this
        this.virtualContainerNode.selectAll('.box').each(function () {
            const node = self.d3.select(this)
            self.hiddenContext.fillStyle = node.attr('colorKey')
            roundRect(
                self.hiddenContext,
                Number(node.attr('x')) - self.unitWidth / 2,
                Number(node.attr('y')) - self.unitHeight / 2,
                self.unitWidth,
                self.unitHeight,
                20,
                true,
                false
            )
        })
    }

    toggleTreeNode(node) {
        // already open: close nodes
        if (node.children) {
            node._children = node.children;
            node.children = null;
        }
        // already closed: open nodes
        else if (node._children) {
            node.children = node._children;
            node._children = null;
            if (node.children) {
                node.children.forEach(child => {
                    child._children = child.children;
                    child.children = null;
                })
            }
        }
    }

    setCanvasListener() {
        this.setClickListener()
        this.setMouseListeners()
    }

    setClickListener() {
        const self = this
        const dpr = window.devicePixelRatio || 1;
        this.canvasNode.node().addEventListener('click', (e) => {
            // gets position of node
            const colorStr = getColorStringFromCanvas(
                self.hiddenContext,
                e.layerX * dpr,
                (e.layerY - 10) * dpr // manual offset fix
            )
            // magic with colors to find node position
            const node = self.colorNodeMap[colorStr]
            if (node) {
                console.log('node: ', node)
                self.toggleTreeNode(node.data()[0])
                self.update(node.data()[0])
            }
        })
    }

    setIsDragging() {
        // for mouse pointer change
        const self = this
        if (self.mouseDown && self.mouseMove && !self.mouseOut && !self.mouseUp) {
            return document.body.classList.add('canvas-grabbing')
        }
        else {
            return document.body.classList.remove('canvas-grabbing')
        }
    }

    setMouseListeners() {
        this.onDrag_ = false
        this.dragStartPoint_ = { x: 0, y: 0 }
        const self = this

        this.canvasNode.node().onmousedown = function (e) {
            self.mouseDown = true
            self.mouseOut = false
            self.mouseUp = false
            self.setIsDragging()
            self.dragStartPoint_.x = e.x
            self.dragStartPoint_.y = e.y
            self.onDrag_ = true
        }

        this.canvasNode.node().onmousemove = function (e) {
            self.mouseMove = true
            self.setIsDragging()
            if (!self.onDrag_) {
                return
            }
            const deltaX = (e.x - self.dragStartPoint_.x) / self.scale;
            const deltaY = (e.y - self.dragStartPoint_.y) / self.scale;
            self.context.translate(deltaX, deltaY);
            self.hiddenContext.translate(deltaX, deltaY);
            self.dragStartPoint_.x = e.x;
            self.dragStartPoint_.y = e.y;
            self.clearCanvas_();
            self.drawCanvas();
        }

        this.canvasNode.node().onmouseout = function (e) {
            self.mouseOut = true
            self.mouseDown = false
            self.setIsDragging()
            if (self.onDrag_) {
                self.onDrag_ = false
            }
        }

        this.canvasNode.node().onmouseup = function (e) {
            self.mouseUp = true
            self.mouseDown = false
            self.setIsDragging()
            if (self.onDrag_) {
                self.onDrag_ = false
            }
        }

        this.canvasNode.node().onwheel = function (e) {
            // 2 finger pinch zoom
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    self.zoomIn()
                } else {
                    self.zoomOut()
                }
            }
            // handle panning
            else {
                e.preventDefault();
                const direction = -1 // set to 1 for natural
                const deltaX = (e.deltaX / self.scale) * direction
                const deltaY = (e.deltaY / self.scale) * direction
                self.context.translate(deltaX, deltaY);
                self.hiddenContext.translate(deltaX, deltaY);
                self.clearCanvas_();
                self.drawCanvas();
            }
        }
    }

    zoomIn() {
        if (this.scale > 7) return;
        this.clearCanvas_();
        const zoomFactor = 1.05;
        this.scale *= zoomFactor;
        this.context.scale(zoomFactor, zoomFactor);
        this.hiddenContext.scale(zoomFactor, zoomFactor);
        this.drawCanvas();
    }

    zoomOut() {
        if (this.scale < 0.1) return;
        this.clearCanvas_();
        const zoomFactor = 0.95;
        this.scale *= zoomFactor;
        this.context.scale(zoomFactor, zoomFactor);
        this.hiddenContext.scale(zoomFactor, zoomFactor);
        this.drawCanvas();
    }

    zoomReset() {
        this.scale = 1.0;
        this.clearCanvas_();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.hiddenContext.setTransform(1, 0, 0, 1, 0, 0);
        this.context.translate(this.width / 2, this.padding);
        this.hiddenContext.translate(this.width / 2, this.padding);
        this.drawCanvas();
    }

    clearCanvas_() {
        this.context.clearRect(-100000, -100000, 1000000, 10000000)
        this.hiddenContext.clearRect(-100000, -100000, 1000000, 10000000)
    }
}