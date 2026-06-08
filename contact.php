<?php
/* ===========================================================
   Le Vitrier — gestionnaire du formulaire de contact
   Envoie les demandes de devis vers levitrier06@gmail.com
   Hébergé sur Hostinger (aucune dépendance externe)
   =========================================================== */

// Anti-spam : champ "honeypot" invisible. Si rempli → bot → on ignore.
if (!empty($_POST['website'])) { header('Location: merci.html'); exit; }

// Refuse tout sauf POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: index.html'); exit; }

// Nettoyage (empêche l'injection d'en-têtes)
function lv_clean($s) { return trim(str_replace(array("\r", "\n"), ' ', $s)); }

$nom       = isset($_POST['nom'])       ? lv_clean($_POST['nom'])       : '';
$telephone = isset($_POST['telephone']) ? lv_clean($_POST['telephone']) : '';
$email     = isset($_POST['email'])     ? lv_clean($_POST['email'])     : '';
$message   = isset($_POST['message'])   ? trim($_POST['message'])       : '';

// Champs obligatoires
if ($nom === '' || $telephone === '' || $message === '') {
  http_response_code(400);
  echo 'Merci de remplir votre nom, votre téléphone et votre message.';
  exit;
}

$to      = 'levitrier06@gmail.com';
$subject = 'Nouvelle demande de devis - levitrier06.fr';

$body  = "Nouvelle demande depuis le site levitrier06.fr\n";
$body .= "----------------------------------------\n\n";
$body .= "Nom       : " . $nom . "\n";
$body .= "Téléphone : " . $telephone . "\n";
$body .= "Email     : " . ($email !== '' ? $email : 'non renseigné') . "\n\n";
$body .= "Message :\n" . $message . "\n";

$headers  = "From: Le Vitrier <no-reply@levitrier06.fr>\r\n";
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
  $headers .= "Reply-To: " . $email . "\r\n";
}
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$subjectEnc = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$ok = @mail($to, $subjectEnc, $body, $headers);

if ($ok) {
  header('Location: merci.html');
  exit;
} else {
  http_response_code(500);
  echo "Une erreur est survenue lors de l'envoi. Appelez-nous directement au 06 77 30 30 65.";
  exit;
}
