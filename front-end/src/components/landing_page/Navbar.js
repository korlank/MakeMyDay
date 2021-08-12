import { useState } from "react";
import { Typography, Button } from "@material-ui/core";
import "./Navbar.css";
import { makeStyles } from "@material-ui/core";
import Login from "components/login/Login";
const useStyles = makeStyles({
  btnbtn: {
    fontWeight: "500",
    borderRadius: "5px",
    marginRight: "2em",
    color: "#FFF",
    backgroundColor: "#007C89",
    "&:hover": {
      backgroundColor: "#406f7f",
      boxShadow: "none",
    },
  },
  navtitle: {
    color: "white",
    marginLeft: "2em",
    fontWeight: "400",
  },
});
function Navbar(props) {
  const classes = useStyles();
  const [openPopup, setOpenPopup] = useState(false);
  return (
    <>
      <nav className="navbar">
        {/* <Typography className={classes.navtitle} variant="body1">
          MAKE MY DAY
        </Typography> */}
        <br />
        <div>
          <Button
            className={classes.btnbtn}
            size="small"
            color="secondary"
            variant="contained"
            onClick={() => setOpenPopup(true)}
          >
            Log in
          </Button>
          <Login
            closePopup={() => setOpenPopup(false)}
            openPopup={openPopup}
            setOpenPopup={setOpenPopup}
          />
          <Button
            className={classes.btnbtn}
            size="small"
            color="primary"
            variant="contained"
          >
            Register
          </Button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
