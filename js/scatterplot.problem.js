function createScatterPlot(data, ax, title = "", xCol = "", yCol = "", rCol = "", legend = [], colorCol = "", margin = 50) {
    // Prepare data
    const X = data.map(d => d[xCol]);
    const Y = data.map(d => d[yCol]);
    const R = data.map(d => d[rCol]);

    // Define color scale
    const colorCategories = [...new Set(data.map(d => d[colorCol]))];
    const color = d3.scaleOrdinal()
        .domain(colorCategories)
        .range(d3.schemeTableau10);

    // Set up scales
    const xExtent = d3.extent(X, d => +d);
    const yExtent = d3.extent(Y, d => +d);
    const xMargin = (xExtent[1] - xExtent[0]) * 0.05; // 5% margin
    const yMargin = (yExtent[1] - yExtent[0]) * 0.05; // 5% margin

    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xMargin, xExtent[1] + xMargin])
        .range([margin, 1000 - margin]);

    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - yMargin, yExtent[1] + yMargin])
        .range([1000 - margin, margin]);

    const rScale = d3.scaleSqrt().domain(d3.extent(R, d => +d)).range([4, 12]);

    const figure = d3.select(`${ax}`);

    // Add circles for data points
    figure.selectAll('.marker')
        .data(data)
        .join('g')
        .attr('transform', d => `translate(${xScale(d[xCol])}, ${yScale(d[yCol])})`)
        .append('circle')
        .attr("class", d => `circle ${d[colorCol]}`)
        .attr("data-model", d => d.Model)
        .attr("r", d => rScale(d[rCol]))
        .attr("fill", d => color(d[colorCol]))
        .style("fill-opacity", 1);

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(4);
    const yAxis = d3.axisLeft(yScale).ticks(4);

    figure.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${1000 - margin})`)
        .call(xAxis);

    figure.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin}, 0)`)
        .call(yAxis);

    // Add labels
    figure.append("text")
        .attr("transform", `translate(${500}, ${1000 - 10})`)
        .text(ax === "#figure2" ? "Engine Size" : xCol)
        .attr("fill", "black");

    figure.append("text")
        .attr("transform", `translate(${35}, ${500}) rotate(270)`)
        .text(yCol)
        .attr("fill", "black");

    // Add title
    figure.append('text')
        .attr('x', 500)
        .attr('y', 80)
        .attr("text-anchor", "middle")
        .text(title)
        .attr("class", "title")
        .attr("fill", "black");

    // Add brushing
    const brush = d3.brush()
        .on("start", brushStart)
        .on("brush end", brushed)
        .extent([
            [margin, margin],
            [1000 - margin, 1000 - margin]
        ]);

    figure.call(brush);

    function brushStart() {
        // Clear selections if no brush exists
        if (!d3.brushSelection(this)) {
            d3.selectAll("circle").classed("selected", false);
        }
    }

    function brushed() {
        const selection = d3.brushSelection(this);
        if (!selection) return;

        const [[x0, y0], [x1, y1]] = selection;
        const [xStart, xEnd] = [xScale.invert(x0), xScale.invert(x1)];
        const [yStart, yEnd] = [yScale.invert(y1), yScale.invert(y0)];

        d3.selectAll("circle").classed("selected", d => (
            d[xCol] >= xStart && d[xCol] <= xEnd &&
            d[yCol] >= yStart && d[yCol] <= yEnd
        ));
    }

    // Add legend
    const legendContainer = figure.append("g")
        .attr("transform", `translate(${800}, ${margin})`);

    if (legend.length === 0) {
        legend = colorCategories;
    }

    const legendItems = legendContainer.selectAll(".legend-item")
        .data(legend)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 45})`);

    legendItems.append("rect")
        .attr("fill", d => color(d))
        .attr("width", 40)
        .attr("height", 40)
        .attr("class", "legend-box")
        .attr("data-category", d => d);

    legendItems.on("click", (event, d) => {
        const isInactive = d3.select(event.currentTarget).select("rect").classed("inactive");
        d3.select(event.currentTarget).select("rect")
            .classed("inactive", !isInactive)
            .style("fill-opacity", isInactive ? 1 : 0.3);

        d3.selectAll(`.circle.${d.replace(/\s+/g, '_')}`)
            .style("fill-opacity", isInactive ? 1 : 0.1);
    });

    legendItems.append("text")
        .text(d => d)
        .attr("x", 50)
        .attr("y", 25)
        .attr("alignment-baseline", "middle")
        .style("font-size", "24px")
        .style("fill", "black");
}