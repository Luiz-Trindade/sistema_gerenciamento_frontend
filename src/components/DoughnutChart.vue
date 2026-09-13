<template>
    <div class="chart-container">
        <Doughnut :data="data" :options="options" />
    </div>
</template>

<script setup>
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

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