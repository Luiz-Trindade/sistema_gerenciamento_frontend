<template>
    <div class="chart-container">
        <Line :data="data" :options="options" />
    </div>
</template>

<script setup>
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

defineProps({
    data: { type: Object, required: true },
    options: { type: Object, required: true }
})
</script>

<style scoped>
.chart-container {
    height: 280px;
    position: relative;
}
</style>