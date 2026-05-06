# UBID Platform Prototype

The **Unified Business Identifier (UBID) Platform** is an AI-powered data engine and web dashboard designed to resolve, link, and monitor business entities across siloed government departments in Karnataka.

By aggregating disparate, messy records from systems like BBMP (Trade Licences), ESCOM (Electricity), Labour, and Factories, the UBID platform uses AI-driven entity resolution (via Splink/Fellegi-Sunter) to identify true business entities and assigns them a unique **UBID**.

## Key Features
* **AI Entity Resolution:** Uses probabilistic linkage to automatically group records that belong to the same business despite typos, missing IDs, or differing addresses.
* **Activity Monitor & Lifecycle Inference:** Decays signal weights over time (e.g. paying an electricity bill vs passing an inspection) to intelligently categorize a business as **ACTIVE**, **DORMANT**, or **CLOSED**.
* **Reviewer Workbench:** Flags ambiguous matches (55%-84% confidence) for manual verification by a human analyst.
* **Cross-Department Query Engine:** Allows filtering across departments (e.g., finding all ACTIVE factories in a specific pin code that haven't had an inspection in 18 months).
* **LLM Explanations:** Optionally uses local Ollama models to generate natural language explanations for AI matching decisions.

## Tech Stack
* **AI Engine:** Python, Pandas, DuckDB, Splink (v3)
* **Backend:** FastAPI, Python 3.11, Uvicorn
* **Frontend:** React, Vite, React Router, Recharts, standard CSS (Dark Theme)

For setup and running instructions, please see [RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md).
