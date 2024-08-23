import React from 'react';
// import {
//   FaFacebookSquare,
//   FaInstagram,
//   FaLinkedin,
//   FaTwitterSquare,
//   FaYoutube,
// } from 'react-icons/fa';
// import { Row, Col } from 'react-bootstrap';

// import '../style/Footer.css';

// import AmiLogo from '../images/footer-ami-logo.png';

function Footer() {
  // const socialMedia = [
  //   { icon: FaFacebookSquare, link: 'https://www.facebook.com/amifundacao' },
  //   { icon: FaInstagram, link: 'https://www.instagram.com/fundacaoami' },
  //   { icon: FaLinkedin, link: 'https://www.linkedin.com/company/fundacaoami' },
  // ];

  // const socialMedia2 = [
  //   { icon: FaTwitterSquare, link: 'https://twitter.com/fundacaoami' },
  //   { icon: FaYoutube, link: 'https://www.youtube.com/user/FundacaoAMI' },
  // ];

  return (
    <footer className="p-4">
      {/* <Row className="align-middle text-center white-18-600-font">
        <Col className="px-5">
          <img
            src={AmiLogo}
            alt="Ami Logo"
            style={{ width: '145px', height: '50px' }}
          />
          <hr className="mt-4" style={{ color: '#000000' }} />
          <p>
            A AMI é uma ONG portuguesa,
            fundada em 1984. Já atuou em 82
            países do mundo e conta com 15
            equipamentos e respostas sociais
            em Portugal. Saiba mais em
            ami.org.pt
          </p>
        </Col>
        <Col className="px-5 mt-3">
          <p className="white-18-600-font">Contactos</p>
          <hr className="mt-4" style={{ color: '#000000' }} />
          <p>
            Rua José do Patrocínio, nº 49<br />
            1959-003 Lisboa<br />
            Tel.: 218 362 100<br />
            NIPC: 502744910<br />
            <a href="boost@ami.org.pt">boost@ami.org.pt</a>
          </p>
        </Col>
        <Col className="px-5 mt-3">
          <p className="white-18-600-font">Siga-nos</p>
          <hr className="mt-4" style={{ color: '#000000' }} />
          <div className="pt-3">
            <Row className="justify-content-center">
              {socialMedia.map((elem) => (
                <a key={elem.link} href={elem.link} className="social-media-icon" style={{ width: 'auto' }}>
                  <elem.icon className="social-media-icon" />
                </a>
              ))}
            </Row>
            <Row className="justify-content-center">
              {socialMedia2.map((elem) => (
                <a key={elem.link} href={elem.link} className="social-media-icon" style={{ width: 'auto' }}>
                  <elem.icon className="social-media-icon" />
                </a>
              ))}
            </Row>
          </div>
        </Col>
      </Row> */}
    </footer>
  );
}

export default Footer;
