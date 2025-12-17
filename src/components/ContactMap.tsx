const ContactMap = () => {
  // Coordinates: 14.603882849098296, -90.52264081857581
  const lat = 14.603882849098296;
  const lng = -90.52264081857581;
  
  return (
    <div className="relative rounded-xl overflow-hidden h-64">
      <iframe
        title="Ubicación Refugio de la Niñez"
        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM2JzE0LjAiTiA5MMKwMzEnMjEuNSJX!5e0!3m2!1ses!2sgt!4v1234567890`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0"
      />
    </div>
  );
};

export default ContactMap;
