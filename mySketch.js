let table;
let padding = 60;
let topPadding = 150;
let points = [];
let searchInput;
let searchQuery = "";
let stateSelect, chamberSelect;
let showStory = false;
let hoveredEvent = null;
let storyTextBox;
let hover = false;

function preload() {
  table = loadTable('HSall_members.csv', 'csv', 'header');
	headerFont = loadFont('Merriweather-Black.ttf');
	standardFont = loadFont('MerriweatherSans-VariableFont_wght.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  textAlign(CENTER, CENTER);
	
	if (history = 0) {
		
	}
	
  let congressYears = table.getColumn('congress').map(Number);
  let nominateDim1 = table.getColumn('nominate_dim1').map(Number);
  let bioname = table.getColumn('bioname');
  let chambers = table.getColumn('chamber');
  let states = table.getColumn('state_abbrev');

  let minCongress = Math.min(...congressYears);
  let maxCongress = Math.max(...congressYears);
  let minYear = congressToYear(minCongress);
  let maxYear = congressToYear(maxCongress);

  // Storing first and last congress for each individual
  let personMap = {};

  for (let i = 0; i < table.getRowCount(); i++) {
    let congress = congressYears[i];
    let name = bioname[i];
    let chamber = chambers[i];
    let state = states[i];
    let polar = nominateDim1[i];
	
  if (isNaN(polar)) continue;

  let year = congressToYear(congress);
  let x = map(year, minYear, maxYear, padding, width - padding);
  let y = map(polar, -1, 1, height - padding, topPadding);

  let pointColor;
  if (polar < -0.3) {
    pointColor = color('#0374EC');
  } else if (polar > 0.3) {
    pointColor = color(255, 0, 0);
  } else {
    pointColor = lerpColor(color('#0374EC'), color(255, 0, 0), map(polar, -0.3, 0.3, 0, 1));
  }

  points.push({ x, y, name, year, polar, chamber, state, color: pointColor });
}

  // Create search input field
  searchInput = createInput();
  searchInput.position(padding, 100);
  searchInput.size(200);
  searchInput.input(updateSearch);

  // Sort state list
  let uniqueStates = [...new Set(states)].filter(state => state !== 'USA').sort();
  uniqueStates.unshift('All States');

  // Create dropdown for state filter
  stateSelect = createSelect();
  stateSelect.position(padding + 220, 100);
  uniqueStates.forEach(state => stateSelect.option(state));
  stateSelect.changed(updateFilter);

  // Create dropdown for chamber filter
  chamberSelect = createSelect();
  chamberSelect.position(padding + 320, 100);
  chamberSelect.option('All Chambers');
  [...new Set(chambers)].forEach(chamber => chamberSelect.option(chamber));
  chamberSelect.changed(updateFilter);
}

function toggleStory() {
  showStory = !showStory;
}

function draw() {
  background(2, 26, 46);

  drawHeader();
  drawLabels();
  drawYearMarkers();

  let closestPoint = null;
  let minDist = Infinity;

  noStroke();
  let selectedState = stateSelect.value();
  let selectedChamber = chamberSelect.value();

  for (let point of points) {
    // Check if the point matches the filters
    let isMatching = searchQuery && point.name.toLowerCase().includes(searchQuery.toLowerCase());
    let stateMatch = selectedState === 'All States' || point.state === selectedState;
    let chamberMatch = selectedChamber === 'All Chambers' || point.chamber === selectedChamber;

    if (!stateMatch || !chamberMatch) continue;

    let pointColor = color(point.color);
    if (!searchQuery) {
      pointColor.setAlpha(120);
    } else if (isMatching) {
      pointColor.setAlpha(255);
    } else {
      pointColor.setAlpha(10);
    }
    fill(pointColor);

    let pointSize = !searchQuery ? 4.5 : isMatching ? 5.5 : 3;
    ellipse(point.x, point.y, pointSize, pointSize);

    // Find the closest point to the mouse for hover display
    if (isMatching) {
      let d = dist(mouseX, mouseY, point.x, point.y);
      if (d < minDist) {
        minDist = d;
        closestPoint = point;
      }
    } else if (!searchQuery && dist(mouseX, mouseY, point.x, point.y) < 5) {
      closestPoint = point;
      minDist = 0;
    }
  }

  if (closestPoint && minDist < 20 && showStory==false) {
    showHoverBox(closestPoint);
  }

  if (showStory) {
    drawHistoricalEvents();

    fill(255);
    textAlign(LEFT);
    textSize(14);
    let description = hoveredEvent
      ? `${hoveredEvent.story}`
      : "Hover over any event to learn more.";
    drawEventDescriptionBox(description, 8*windowWidth/10, 100, windowWidth-padding-8*windowWidth/10);
  }
	
	if (checkHover()) {
    hover=true; // Change color or style on hover
  } else {
    hover=false; // Default color
  }
	drawStoryTextBox(hover);
}

function drawHeader() {
  fill(255);
  textSize(30);
  textAlign(LEFT);
	textFont(headerFont);
  text("Seeing Red, Feeling Blue: Ideological Polarization in America's Congress", padding, 40);
	textFont(standardFont);
  textSize(14);
  text("Hover over points to see details; use search box to filter by name.", padding, 77);
}

function drawLabels() {
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);

  push();
  translate(padding / 2, (height - topPadding - padding) / 2 + topPadding);
  rotate(-HALF_PI);
  text('More Liberal ———————————————	More Conservative', 0, 0);
  pop();

  stroke(0);
  line(padding, map(0, -1, 1, height - padding, topPadding), width - padding, map(0, -1, 1, height - padding, topPadding));
}

let historicalEvents = [
  { startYear: 1861, endYear: 1865, label: "Civil War", story:  "During the Civil War, Southern states seceded from the Union and withdrew their Congressional representatives, leading to a period of reduced ideological division in Congress. After the war, when Southern states were readmitted, Congress's ideological polarization grew rapidly. The following Reconstruction era brought intense debates about integrating the South and protecting the rights of newly freed Black Americans, solidifying divides that would shape Congress for over a century to come." },
  { startYear: 1876, endYear: 1900, label: "Rise of Industrialism", story:  "As the U.S. emerged as an industrial giant, Congress experienced peak ideological division over economic policies and labor rights, driven by tensions between pro-business interests and progressive reformers." },
  { startYear: 1914, endYear: 1918, label: "World War I", story:  "While there was broad support for the war effort, Congress's divide reveals the ideological and partisan divide that existed, particularly over issues like military conscription, government intervention in the economy, and civil liberties." },
  { startYear: 1939, endYear: 1945, label: "World War II", story:  "During WWII, Congress showed minimal ideological division as both parties rallied to support the war effort. National defense took precedence, and bipartisan cooperation helped drive patriotism, legislation for military funding, and post-war recovery planning." },
  { startYear: 1954, endYear: 1968, label: "Civil Rights Movement", story:  "Despite strong regional opposition, Congress was largely united on key civil rights legislation during this period. The Voting Rights Act of 1965 passed by a 77-19 vote in Senate and 333-85 in Congress." },
];

function drawHistoricalEvents() {
  hoveredEvent = null;
  let barAlpha = 100;
  let highlightAlpha = 10;
  let boldHighlightAlpha = 50;

  for (let event of historicalEvents) {
    let xStart = map(event.startYear, 1789, 2024, padding, width - padding);
    let xEnd = map(event.endYear, 1789, 2024, padding, width - padding);

    // Check if the mouse is hovering over this event's highlight area
    if (mouseX > xStart && mouseX < xEnd && mouseY > topPadding && mouseY < height - padding) {
      hoveredEvent = event;
      fill(255, boldHighlightAlpha);
    } else {
      fill(255, highlightAlpha);
    }

    noStroke();
    rect(xStart, topPadding, xEnd - xStart, height - padding - topPadding);

    strokeWeight(2);
    stroke(255, barAlpha);
    line(xStart, topPadding, xStart, height - padding);
    line(xEnd, topPadding, xEnd, height - padding);

    if (showStory) {
      let labelX = (xStart + xEnd) / 2;
      noStroke();
      fill(255);
      push();
			textSize(12);
      translate(labelX, topPadding - 15);
      rotate(-PI / 20);
      text(`${event.label} (${event.startYear}-${event.endYear})`, 0, 0);
      pop();
    }
  }
}

function drawYearMarkers() {
  textSize(11);
  fill(255);
  textAlign(CENTER);

  let startYear = congressToYear(Math.min(...table.getColumn('congress').map(Number)));
  let endYear = congressToYear(Math.max(...table.getColumn('congress').map(Number)));
  for (let year = startYear; year <= endYear; year += 20) {
    let x = map(year, startYear, endYear, padding, width - padding);
    line(x, height - padding, x, height - padding + 5); // Small tick
    text(year, x, height - padding + 25);
  }

  let barAlpha = 100;
  let highlightAlpha = 10;
}

// Short helper functions
// Convert congress number to starting year
function congressToYear(congress) {
  return 1789 + 2 * (congress - 1);
}

// update search term based on input field
function updateSearch() {
  searchQuery = this.value();
}

function updateFilter() {
  redraw();
}

function showHoverBox(point) {

  let nameText = point.name;
  //let chamberText = `${point.chamber}, ${point.first_year} - ${point.last_year}, ${point.state}`;
	let chamberText = `${point.chamber}, ${point.year}, ${point.state}`;
  let polarText = `Polarization: ${point.polar.toFixed(2)}`;

  textSize(12);

  let nameWidth = textWidth(nameText);
  let chamberWidth = textWidth(chamberText);
  let polarWidth = textWidth(polarText);
  let infoWidth = max(nameWidth, chamberWidth, polarWidth) + 20;
  infoWidth = max(infoWidth, 110);

  let popupHeight = 60;

  let xPos, yPos;
  if (mouseY <= 0.8 * windowHeight) {
    if (mouseX <= 0.5 * windowWidth) {
      xPos = mouseX + 10;
      yPos = mouseY + 10;
    } else {
      xPos = mouseX - infoWidth - 10;
      yPos = mouseY + 10;
    }
  } else {
    if (mouseX <= 0.5 * windowWidth) {
      xPos = mouseX + 10;
      yPos = mouseY - popupHeight - 10;
    } else {
      xPos = mouseX - infoWidth - 10;
      yPos = mouseY - popupHeight - 10;
    }
  }

  fill(255, 200);
  stroke(0);
  rect(xPos, yPos, infoWidth, popupHeight, 5);

  fill(0);
  noStroke();
  textAlign(LEFT);
  text(nameText, xPos + 10, yPos + 15);
  text(chamberText, xPos + 10, yPos + 30);
  text(polarText, xPos + 10, yPos + 45);
}

function drawStoryTextBox(hover) {
  let textBoxX = windowWidth - padding - 175;
  let textBoxY = 30;
  let textBoxWidth = 175;
  let textBoxHeight = 40;
  let buttonText = showStory ? "Explore Politicians" : "Learn the History";

	if(hover == false){
		fill(255);
	}
	if(hover == true){
		fill(187, 215, 237);
	}
  noStroke();
  rect(textBoxX, textBoxY, textBoxWidth, textBoxHeight, 5);

  fill('#021a2e');
  textSize(17);
  textAlign(CENTER, CENTER);
  text(buttonText, textBoxX + textBoxWidth / 2, textBoxY + textBoxHeight / 2 -2);
}

function drawEventDescriptionBox(txt, x, y, maxWidth) {
  textAlign(LEFT, TOP);
  textSize(14);

  // Split text into lines to determine the width and height of the box
  let words = txt.split(" ");
  let line = "";
  let lineHeight = textAscent() + textDescent();
  let lines = [];
  let boxWidth = 0;

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + " ";
    let testWidth = textWidth(testLine);

    // Wrap to new line if the line exceeds maxWidth
    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      boxWidth = max(boxWidth, textWidth(line)); // Update the max width
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line); // Add the last line
  boxWidth = maxWidth; // Final width check
  let boxHeight = lines.length * lineHeight; // Total height based on number of lines

  // Draw a semi-transparent background box with padding
  let boxpadding = 7;
  fill(255, 210); // Semi-transparent background
  noStroke();
  rect(x - boxpadding*2, y - boxpadding, boxWidth + boxpadding*2, boxHeight + boxpadding * 2, 5);

  // Draw the text line by line
  fill('#021a2e');
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x, y + i * lineHeight);
  }
}



function mousePressed() {
  let textBoxX = windowWidth - padding - 175;
  let textBoxY = 30;
  let textBoxWidth = 175;
  let textBoxHeight = 40;

  if (
    mouseX > textBoxX &&
    mouseX < textBoxX + textBoxWidth &&
    mouseY > textBoxY &&
    mouseY < textBoxY + textBoxHeight
  ) {
    toggleStory();
  }
}

function checkHover() {
  let textBoxX = windowWidth - padding - 175;
  let textBoxY = 30;
  let textBoxWidth = 175;
  let textBoxHeight = 40;

  return (
    mouseX > textBoxX &&
    mouseX < textBoxX + textBoxWidth &&
    mouseY > textBoxY &&
    mouseY < textBoxY + textBoxHeight
  );
}