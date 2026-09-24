export function animateValue(refTarget, targetValue, duration = 1500) {
    const startValue = 0
    const startTime = performance.now()

    function update(currentTime) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing: easeOutQuart - começa rápido e desacelera suavemente
        const eased = 1 - Math.pow(1 - progress, 5)
        refTarget.value = startValue + (targetValue - startValue) * eased

        if (progress < 1) {
            requestAnimationFrame(update)
        } else {
            refTarget.value = targetValue
        }
    }

    requestAnimationFrame(update)
}
