<template>
    <div class="chart">
        <div class="zoom-buttons">
            <div class="bigger" @click="orgChart.zoomIn()">Zoom in</div>
            <div class="smaller" @click="orgChart.zoomOut()">Zoom out</div>
            <div class="reset" @click="orgChart.zoomReset()">Zoom reset</div>
        </div>
        <div id="d3-chart-container"></div>
    </div>
</template>

<script setup lang="ts">
import { d3Chart } from './classes/d3Chart'
import { ref } from 'vue'
import Data from './data.json' with { type: 'json' }

const data = ref(null)
const orgChart = ref(null)

onMounted(() => {
    data.value = Data
    orgChart.value = new d3Chart()
    orgChart.value.draw(data.value)
})
</script>

<style scoped>
.chart {
    background-color: #eeeeee;
}
</style>

<style>
.orgChart.hidden {
    display: none;
}
.canvas-grabbing {
    cursor: grabbing;
}
.zoom-buttons {
    position: absolute;
    top: 0;
    left: 0;
    margin-top: 50px;
    padding: 20px;
}
</style>