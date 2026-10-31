#!/usr/bin/perl
use strict;
use warnings;
use Compress::Zlib;

sub make_png {
    my ($file, $size) = @_;
    my $width = $size;
    my $height = $size;

    # Costruisci i dati dell'immagine: RGBA per ogni pixel
    my $raw_data = '';
    my $cx = $width / 2;
    my $cy = $height / 2;
    my $r_outer = $width * 0.44;
    my $r_inner = $width * 0.36;
    my $r_center = $width * 0.22;

    for (my $y = 0; $y < $height; $y++) {
        $raw_data .= "\x00"; # Filter byte: None
        for (my $x = 0; $x < $width; $x++) {
            my $dx = $x - $cx;
            my $dy = $y - $cy;
            my $dist = sqrt($dx * $dx + $dy * $dy);

            my ($r, $g, $b, $a);

            # Angoli arrotondati / squircle background
            my $corner_r = $width * 0.22;
            my $in_box = 1;
            my $bx = abs($x - $cx) - ($cx - $corner_r);
            my $by = abs($y - $cy) - ($cy - $corner_r);
            if ($bx > 0 && $by > 0) {
                if (sqrt($bx * $bx + $by * $by) > $corner_r) {
                    $in_box = 0;
                }
            }

            if (!$in_box) {
                ($r, $g, $b, $a) = (0, 0, 0, 0); # Trasparente
            } elsif ($dist >= $r_inner && $dist <= $r_outer) {
                # Anello esterno pista (Arancione vivace / Rosso fuoco)
                ($r, $g, $b, $a) = (249, 115, 22, 255); # #f97316
            } elsif ($dist < $r_inner && $dist >= $r_inner - ($width * 0.05)) {
                # Bordo cianetto cronometro
                ($r, $g, $b, $a) = (56, 189, 248, 255); # #38bdf8
            } elsif ($dist < $r_center) {
                # Fulmine / lancetta centrale gialla
                if (abs($dx + $dy * 0.4) < ($width * 0.06) && $dy > -$width*0.25 && $dy < $width*0.25) {
                    ($r, $g, $b, $a) = (251, 191, 36, 255); # Giallo #fbbf24
                } else {
                    ($r, $g, $b, $a) = (30, 41, 59, 255); # Blu scuro card
                }
            } else {
                # Sfondo card scuro (#090d16 / #0f172a)
                ($r, $g, $b, $a) = (15, 23, 42, 255);
            }

            $raw_data .= pack('CCCC', $r, $g, $b, $a);
        }
    }

    # Comprimi con zlib
    my $compressed = compress($raw_data);

    # Scrivi PNG
    open(my $fh, '>:raw', $file) or die "Cannot write to $file: $!\n";
    # PNG Signature
    print $fh "\x89PNG\x0D\x0A\x1A\x0A";

    # IHDR Chunk
    my $ihdr = pack('NNCCCCC', $width, $height, 8, 6, 0, 0, 0); # 8-bit RGBA
    write_chunk($fh, 'IHDR', $ihdr);

    # IDAT Chunk
    write_chunk($fh, 'IDAT', $compressed);

    # IEND Chunk
    write_chunk($fh, 'IEND', '');

    close($fh);
    print "Generato: $file (${size}x${size})\n";
}

sub write_chunk {
    my ($fh, $type, $data) = @_;
    my $len = length($data);
    print $fh pack('N', $len);
    print $fh $type;
    print $fh $data;
    my $crc = Compress::Zlib::crc32($type . $data);
    print $fh pack('N', $crc);
}

make_png('icons/icon-192.png', 192);
make_png('icons/icon-512.png', 512);
