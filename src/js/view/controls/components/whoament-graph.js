import { whoamentGraphContainer, whoamentGraphBar, whoamentCanvas } from '../templates/whoament-graph';
import { createElement } from '../../../utils/dom';
import Chart from 'chart.js';

export default class WhoamentGraph {
    constructor () {
        this.container = createElement(whoamentCanvas());
        this.bars = [];
        this.chart = null;
    }

    render (map, duration) {
        this.destroy();
        this.container = createElement(whoamentGraphContainer());
        const { bars, container } = this;
        for (let i = 0; i < duration; i++) {
            const bar = createElement(whoamentGraphBar());
            bar.style.height = `${2 * (map[i] || 1)}px`;
            container.appendChild(bar);
        }
    }

    renderChart (map, position, duration) {
        const container = this.container;
        const ctx = container.querySelector('canvas');
        const data = map.map((val, i) => ({
            x: i,
            y: val
        }));

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 50);
        gradient.addColorStop(0.1, 'red');
        gradient.addColorStop(0.7, 'yellow');
        gradient.addColorStop(1, 'white');

        const chart = this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        type: 'scatter',
                        data: this.timePointData,
                        fill: false,
                        backgroundColor: 'white',
                        pointRadius: 7
                    },
                    {
                        borderColor: gradient,
                        fill: false,
                        data,
                        pointRadius: 0,
                        borderWidth: 4
                    }
                ],
                showLine: true
            },
            options: {
                responsive: true,
                scales: {
                    yAxes: [{
                        display: false
                    }],
                    xAxes: [{
                        type: 'linear',
                        display: false,
                        ticks: {
                            max: map.length - 1
                        }
                    }],
                },
                legend: {
                    display: false
                },
                elements: {
                    point: {
                        // radius: 0
                    }
                },
                layout: {
                    padding: {
                        left: 60,
                        right: 60,
                        bottom: 10
                    }
                },
                onClick: (e) => {
                    // const ele = chart.getElementAtEvent(e);
                    // debugger;
                    // console.log('zee')
                },
                onHover: () => {
                    // console.log('zee')
                },
                tooltips: {
                    mode: 'point'
                }
            }
        });
    }

    updateTime (time) {
        const { chart } = this;
        if (!chart) {
            return;
        }

        const map = chart.data.datasets[1].data;
        const point = map[Math.round(time)];
        if (!point) {
            return;
        }
        chart.data.datasets[0].data = [{ x: time, y: point.y}];
        chart.update();
    }

    element () {
        return this.container;
    }

    destroy () {
        this.container = null;
    }
}