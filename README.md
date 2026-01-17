# 🚛 Logistic Route Optimizer

A powerful, interactive web application that visualizes complex graph algorithms to solve logistic routing problems. This tool allows users to build city networks, simulate road connections, and calculate the optimal round-trip path for a delivery truck using the **Traveling Salesman Problem (TSP)** logic.

![Project Screenshot](https://via.placeholder.com/800x450.png?text=Logistic+Route+Optimizer+Screenshot)
*(Replace this link with a real screenshot of your app!)*

## 🌟 Features

* **Interactive Graph Builder:**
    * **Add Cities:** Dynamically create nodes on the map.
    * **Connect Roads:** Create weighted edges (roads) with specific travel costs.
    * **Drag & Drop:** Fully interactive physics-based canvas.
    * **Edit & Delete:** Click any city or road to modify values or right-click to delete.
* **Advanced Algorithms:**
    * **Metric Closure:** Automatically calculates "Virtual Roads" (dashed red lines) to find the shortest path between disconnected cities using intermediate stops.
    * **TSP Solver:** Optimization engine that determines the most efficient route to visit all cities and return to the start.
* **Simulation Tools:**
    * **🎲 Randomize Map:** Instantly generates complex graph scenarios to test the algorithm.
    * **✨ Auto-Layout Engines:** Switch between *Organic*, *Force Atlas*, and *Tree* layouts to organize messy graphs.
    * **📜 Step-by-Step Log:** Detailed sidebar breakdown of every step in the optimal route.

## 🧠 How It Works

The application solves the **Metric Traveling Salesman Problem** using a two-step process:

1.  **Metric Closure (Floyd-Warshall Algorithm):**
    First, it calculates the shortest distance between *every* pair of cities. If City A and City C are not directly connected, the algorithm finds the best path through other cities (e.g., A → B → C) and creates a "Virtual Edge" representing that total cost.

2.  **Route Optimization (Greedy Nearest Neighbor):**
    Using the complete distance matrix from step 1, the truck starts at a selected node and iteratively chooses the nearest unvisited city. Finally, it calculates the return trip to the start, ensuring a complete loop.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite
* **Visualization:** Vis.js (vis-network, vis-data)
* **Styling:** CSS-in-JS (Custom Dark Theme)
* **Algorithms:** Graph Theory (DFS/BFS, Shortest Path, TSP)

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
* Node.js installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/Logistic-Route-Optimizer.git](https://github.com/your-username/Logistic-Route-Optimizer.git)
    cd Logistic-Route-Optimizer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Click the link shown in the terminal (usually `http://localhost:5173`).

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Add City** | Click the "Add City" button in the sidebar. |
| **Connect** | Click "Connect Cities", select Start City, then select End City. |
| **Move** | Drag any blue circle (City) to move it. |
| **Edit** | Click any City or Line to edit its name or cost in the sidebar. |
| **Delete** | Select an item and click "Delete" in the sidebar. |
| **Auto-Layout** | Use the "Auto-Layout" button or change the engine dropdown. |

## 🔮 Future Improvements
* Implement Dijkstra's Algorithm visualization.
* Add 3D Map View.
* Save/Load maps from local storage.

---

**Author:** [Your Name]