//Create dimensions
const width = 900;
const height = 900;                

//Create a title element
const title = d3.select("#container")
                .append("h1")
                .attr("id", "title");

//Create a description element
const description = d3.select("#container")
                    .append("p")
                    .attr("id", "description");

//Create a svg element
const svg = d3.select("#container")
                .append("svg")
                .attr("width", width)
                .attr("height", height + 300);

// Append a tooltip
const tooltip = d3.select("#container")
    .append("div")
    .attr("id", "tooltip");

//Fetch multiple data sources
Promise.all([
fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json").then(response => response.json()),
fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json").then(response => response.json()),
fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json").then(response => response.json())
]).then(([video, movies, kickstarter]) => {
    const datasets = [video, movies, kickstarter];

    //Function to process and update the visualization
    function updateVisualization(data, titleText, descriptionText) {
        svg.selectAll("*").remove(); //Clear previous visualization
        tooltip.style("opacity", 0); //Clear previous tooltip

        title.text(titleText);
        description.text(descriptionText);
        
        //Create a color scale
        const colors = [...d3.schemeCategory10,...d3.schemeSet3];
        const color = d3.scaleOrdinal(data.children.map(d => d.name), colors.slice(0, data.children.length));

        //Compute the layout
        const treemap = d3.treemap()
            .tile(d3.treemapSquarify)
            .size([width, height])
            .padding(1); 
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        treemap(root);

        //Add a cell for each leaf of the hierarchy
        const leaf = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
                .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

        console.log(root.leaves());
        // Append a color rectangle. 
        leaf.append("rect")
            .attr("class", "tile")
            .attr("data-name", d => d.data.name)
            .attr("data-category", d => d.data.category)
            .attr("data-value", d => d.data.value)
            .attr("fill", d => color(d.data.category))
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .on ("mousemove", (event, d) => {
                tooltip.transition()
                .duration(100)
                .style("opacity", 0.9).style("box-shadow", "0 6px 12px rgba(0, 0, 0, 0.2)")                
                .attr("data-value", `${d.data.value}`);
                tooltip.html(`Name: ${d.data.name}<br>Category: ${d.data.category}<br>Value: ${d.data.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(100).style("opacity", 0);
            });

         // Append a clipPath to ensure text does not overflow
         leaf.append("clipPath")
            .attr("id", d => `clip-${d.data.name.replace(/\s+/g, '-')}`)
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);
         
        // Append multiline text
        leaf.append("text")
            .attr("id", d => `clip-${d.data.name}`)
            .attr("x", 3)
            .attr("y", 3)
            .attr("clip-path", d => `url(#clip-${d.data.name.replace(/\s+/g, '-')})`)
            .selectAll("tspan")
            .data(d => d.data.name.split(" "))
            .enter()
            .append("tspan")
                .style("font-size", "0.45rem")
                .attr("x", 5)
                .attr("dy", "1em")
                .text(d => d); 

        //Create a legend
        const columns = 3;
        const legend = svg.append("g")
            .attr("id", "legend")
            .attr("transform", "translate(250, 910)");

        legend.selectAll("rect")
            .data(color.domain())
            .enter()
            .append("rect")
            .attr("class", "legend-item")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", (d, i) => (i % columns) * 150)
            .attr("y", (d, i) => Math.floor(i / columns) * 30)
            .attr("fill", color);

        legend.selectAll("text")
            .data(color.domain())
            .enter()
            .append("text")
            .attr("x", (d, i) => (i % columns) * 150 + 25)
            .attr("y", (d, i) => Math.floor(i / columns) * 30 + 12)
            .text(d => d)
            .style("font-size", "1rem")
            .attr("alignment-baseline", "middle");
    }
    //Initial visualization with the first dataset
    updateVisualization(video, "Video Game Sales", "Top 100 Most Sold Video Games Grouped by Platform");

    //Event listeners for anchor elements
    d3.select("#video").on("click", () => updateVisualization(video, "Video Game Sales", "Top 100 Most Sold Video Games Grouped by Platform"));
    d3.select("#movies").on("click", () => updateVisualization(movies, "Movie Sales", "Top 100 Highest Grossing Movies Grouped By Genre"));
    d3.select("#kickstarter").on("click", () => updateVisualization(kickstarter, "Kickstarter Pledges", "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category"));     
})
.catch(error => {
    alert("There was an error loading the data");
});