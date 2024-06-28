import * as d3 from 'd3'
import { roundRect, text, wrapText, getColorStringFromCanvas, randomColor, isHorizontal } from './utils'

export class d3Chart {
    d3: any
    width: number
    height: number
    padding: number
    nodeWidth: number
    nodeHeight: number
    unitPadding: number
    unitWidth: number
    unitHeight: number
    duration: number
    scale: number
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
        this.nodeWidth = 180
        this.nodeHeight = 280
        // org unit size
        this.unitPadding = 20
        this.unitWidth = 140
        this.unitHeight = 100
        // animation duration
        this.duration = 600
        this.scale = 1.0
    }

    draw(data) {
        this.data = this.d3.hierarchy(data)
        this.treeGenerator =
            this.d3
                .tree()
                .nodeSize([this.nodeWidth, this.nodeHeight])
        this.update(null)

        const self = this
        this.d3.timer(function () {
            self.drawCanvas()
        })
    }

    update(targetTreeNode) {
        this.treeData = this.treeGenerator(this.data)
        const nodes = this.treeData.descendants()
        const links = this.treeData.links()

        let animatedStartX = 0
        let animatedStartY = 0
        let animatedEndX = 0
        let animatedEndY = 0

        if (targetTreeNode) {
            animatedStartX = targetTreeNode.x0
            animatedStartY = targetTreeNode.y0
            animatedEndX = targetTreeNode.x
            animatedEndY = targetTreeNode.y
        }
        this.updateOrgUnits(
            nodes,
            animatedStartX,
            animatedStartY,
            animatedEndX,
            animatedEndY
        )
        this.updateLinks(
            links,
            animatedStartX,
            animatedStartY,
            animatedEndX,
            animatedEndY
        )

        this.addColorKey()
        this.bindNodeToTreeData()
    }

    updateOrgUnits(
        nodes,
        animatedStartX,
        animatedStartY,
        animatedEndX,
        animatedEndY
    ) {
        let orgUnitSelection = this.virtualContainerNode
            .selectAll('.orgUnit')
            .data(nodes, (d) => d['colorKey'])

        orgUnitSelection
            .attr('class', 'orgUnit')
            .attr('x', function (data) { return isHorizontal ? data.x0 : data.y0 })
            .attr('y', function (data) { return isHorizontal ? data.y0 : data.x0 })
            .transition()
            .duration(this.duration)
            .attr('x', function (data) { return isHorizontal ? data.x : data.y })
            .attr('y', function (data) { return isHorizontal ? data.y : data.x })
            .attr('fillStyle', '#ff0000')

        orgUnitSelection
            .enter()
            .append('orgUnit')
            .attr('class', 'orgUnit')
            .attr('x', isHorizontal ? animatedStartX : animatedStartY)
            .attr('y', isHorizontal ? animatedStartY : animatedStartX)
            .transition()
            .duration(this.duration)
            .attr('x', function (data) { return isHorizontal ? data.x : data.y })
            .attr('y', function (data) { return isHorizontal ? data.y : data.x })
            .attr('fillStyle', '#ff0000')

        orgUnitSelection
            .exit()
            .transition()
            .duration(this.duration)
            .attr('x', isHorizontal ? animatedEndX : animatedEndY)
            .attr('y', isHorizontal ? animatedEndY : animatedEndX)
            .remove()

        // record origin index for animation
        nodes.forEach((treeNode) => {
            treeNode['x0'] = isHorizontal ? treeNode.x : treeNode.y
            treeNode['y0'] = isHorizontal ? treeNode.y : treeNode.x
        })

        orgUnitSelection = null
    }

    updateLinks(
        links,
        animatedStartX,
        animatedStartY,
        animatedEndX,
        animatedEndY
    ) {
        let linkSelection = this.virtualContainerNode
            .selectAll('.link')
            .data(links, function (d) {
                return d.source['colorKey'] + ':' + d.target['colorKey']
            })

        linkSelection
            .attr('class', 'link')
            .attr('sourceX', function (link) { return isHorizontal ? link.source['x00'] : link.source['y00'] })
            .attr('sourceY', function (link) { return isHorizontal ? link.source['y00'] : link.source['x00'] })
            .attr('targetX', function (link) { return isHorizontal ? link.target['x00'] : link.target['y00'] })
            .attr('targetY', function (link) { return isHorizontal ? link.target['y00'] : link.target['x00'] })
            .transition()
            .duration(this.duration)
            .attr('sourceX', function (link) { return isHorizontal ? link.source.x : link.source.y })
            .attr('sourceY', function (link) { return isHorizontal ? link.source.y : link.source.x })
            .attr('targetX', function (link) { return isHorizontal ? link.target.x : link.target.y })
            .attr('targetY', function (link) { return isHorizontal ? link.target.y : link.target.x })

        linkSelection
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

        linkSelection
            .exit()
            .transition()
            .duration(this.duration)
            .attr('sourceX', isHorizontal ? animatedEndX : animatedEndY)
            .attr('sourceY', isHorizontal ? animatedEndY : animatedEndX)
            .attr('targetX', isHorizontal ? animatedEndX : animatedEndY)
            .attr('targetY', isHorizontal ? animatedEndY : animatedEndX)
            .remove()

        // record origin data for animation
        links.forEach((treeNode) => {
            treeNode.source['x00'] = isHorizontal ? treeNode.source.x : treeNode.source.y
            treeNode.source['y00'] = isHorizontal ? treeNode.source.y : treeNode.source.x
            treeNode.target['x00'] = isHorizontal ? treeNode.target.x : treeNode.target.y
            treeNode.target['y00'] = isHorizontal ? treeNode.target.y : treeNode.target.x
        })
        linkSelection = null
    }

    // initCanvas() {
    //     this.container = this.d3.select('#d3-chart-container')

    //     const dpr = window.devicePixelRatio || 1;
    //     this.canvasNode = this.container
    //         .append('canvas')
    //         .attr('class', 'orgChart')
    //         .attr('width', this.width * dpr)
    //         .attr('height', this.height * dpr)
    //         .style('width', `${this.width}px`)
    //         .style('height', `${this.height}px`)

    //     this.hiddenCanvasNode = this.container
    //         .append('canvas')
    //         .attr('class', 'orgChart')
    //         .attr('width', this.width * dpr)
    //         .attr('height', this.height * dpr)
    //         .style('width', `${this.width}px`)
    //         .style('height', `${this.height}px`)
    //         .style('display', '')

    //     this.context = this.canvasNode.node().getContext('2d')
    //     this.context.scale(dpr, dpr)
    //     this.context.translate(this.width / 2, this.padding)

    //     this.hiddenContext = this.hiddenCanvasNode.node().getContext('2d')
    //     this.hiddenContext.scale(dpr, dpr)
    //     this.hiddenContext.translate(this.width / 2, this.padding)
    // }

    initCanvas() {
        this.container = this.d3.select('#d3-chart-container')
        this.canvasNode = this.container
            .append('canvas')
            .attr('class', 'orgChart')
            .attr('width', this.width)
            .attr('height', this.height)
        this.hiddenCanvasNode = this.container
            .append('canvas')
            .attr('class', 'orgChart')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('display', '')
        this.context = this.canvasNode.node().getContext('2d')
        this.context.translate(this.width / 2, this.padding)
        this.hiddenContext = this.hiddenCanvasNode.node().getContext('2d')
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
        this.virtualContainerNode.selectAll('.orgUnit').each(function () {
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
        this.virtualContainerNode.selectAll('.orgUnit').each(function () {
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
            const linkPath = self.d3
                .linkHorizontal()
                .x(function (d) {
                    return d.x
                })
                .y(function (d) {
                    return d.y
                })
                .source(function () {
                    return { x: node.attr('sourceX'), y: node.attr('sourceY') }
                })
                .target(function () {
                    return { x: node.attr('targetX'), y: node.attr('targetY') }
                })
            const path = new Path2D(linkPath())
            self.context.stroke(path)
        })

        this.virtualContainerNode.selectAll('.orgUnit').each(function () {
            const node = self.d3.select(this)
            const treeNode = node.data()[0]
            const data = treeNode.data
            self.context.fillStyle = '#3ca0ff'
            const indexX = Number(node.attr('x')) - self.unitWidth / 2
            const indexY = Number(node.attr('y')) - self.unitHeight / 2

            // draw unit outline rect (if you want to modify this line => please modify the same line in 'drawHiddenCanvas')

            roundRect(
                self.context,
                indexX,
                indexY,
                self.unitWidth,
                self.unitHeight,
                4,
                true,
                false
            )

            text(
                self.context,
                data.name,
                indexX + self.unitPadding,
                indexY + self.unitPadding,
                '20px',
                '#ffffff'
            )

            wrapText(
                self.context,
                data.name,
                indexX + self.unitPadding,
                indexY + self.unitPadding + 24,
                self.unitWidth - 2 * self.unitPadding,
                20,
                '#000000'
            )
        })
    }

    drawHiddenCanvas() {
        this.hiddenContext.clearRect(-this.width / 2, -this.padding, this.width, this.height)
        const self = this
        this.virtualContainerNode.selectAll('.orgUnit').each(function () {
            const node = self.d3.select(this)
            self.hiddenContext.fillStyle = node.attr('colorKey')
            roundRect(
                self.hiddenContext,
                Number(node.attr('x')) - self.unitWidth / 2,
                Number(node.attr('y')) - self.unitHeight / 2,
                self.unitWidth,
                self.unitHeight,
                4,
                true,
                false
            )
        })
    }

    setCanvasListener() {
        this.setClickListener()
        this.setDragListener()
        this.setMouseWheelZoomListener()
    }

    setClickListener() {
        console.log('log 1')
        const self = this
        this.canvasNode.node().addEventListener('click', (e) => {
            console.log(`log 2:  x: ${e.layerX}  y: ${e.layerY}`)
            const colorStr = getColorStringFromCanvas(
                self.hiddenContext,
                e.layerX,
                e.layerY
            )
            const node = self.colorNodeMap[colorStr]
            if (node) {
                console.log('log 3')
                self.toggleTreeNode(node.data()[0])
                self.update(node.data()[0])
            }
        })
    }

    setMouseWheelZoomListener() {
        const self = this
        this.canvasNode.node().addEventListener('mousewheel', (event) => {
            event.preventDefault()
            if (event.deltaY < 0) {
                self.zoomIn()
            } else {
                self.zoomOut()
            }
        })
    }

    setDragListener() {
        this.onDrag_ = false
        this.dragStartPoint_ = { x: 0, y: 0 }
        const self = this
        this.canvasNode.node().onmousedown = function (e) {
            self.dragStartPoint_.x = e.x
            self.dragStartPoint_.y = e.y
            self.onDrag_ = true
        }
        this.canvasNode.node().onmousemove = function (e) {
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
            if (self.onDrag_) {
                self.onDrag_ = false
            }
        }
        this.canvasNode.node().onmouseup = function (e) {
            if (self.onDrag_) {
                self.onDrag_ = false
            }
        }
    }

    toggleTreeNode(treeNode) {
        if (treeNode.children) {
            treeNode._children = treeNode.children
            treeNode.children = null
        } else {
            treeNode.children = treeNode._children
            treeNode._children = null
        }
    }

    zoomIn() {
        if (this.scale > 7) return;
        this.clearCanvas_();
        const zoomFactor = 1.1;
        this.scale *= zoomFactor;
        this.context.scale(zoomFactor, zoomFactor);
        this.hiddenContext.scale(zoomFactor, zoomFactor);
        this.drawCanvas();
    }

    zoomOut() {
        if (this.scale < 0.1) return;
        this.clearCanvas_();
        const zoomFactor = 0.9;
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