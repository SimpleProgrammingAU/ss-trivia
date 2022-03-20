import React, { Component } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Button from "@mui/material/Button";
import { Host, Player } from "../components";
import styles from "../styles/Home.module.css";

class Home extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = { mode: "player" };
  }

  private _toggleMode = () => {
    const { mode } = this.state;
    this.setState({ mode: mode === "player" ? "host" : "player" });
  };

  render = () => {
    const { mode } = this.state;
    return (
      <>
        <div className="App">{mode === "player" ? <Player /> : <Host />}</div>
        <footer className={styles.footer}>
          <Button onClick={this._toggleMode}>{mode === "host" ? "Player" : "Host"} Mode</Button>
        </footer>
      </>
    );
  };
}

interface AppProps {}
interface AppState {
  mode: "player" | "host";
}

export default Home;
