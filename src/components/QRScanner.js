import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QRScanner({ onScan, onClose }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) {
        // Camera permissions are still loading
        return <View style={styles.container}><Text>Načítání oprávnění k fotoaparátu...</Text></View>;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>Pro naskenování přihlašovacího QR kódu je nutný přístup k fotoaparátu.</Text>
                <Button onPress={requestPermission} title="Povolit přístup k fotoaparátu" color="#3B82F6" />
                <TouchableOpacity style={{ marginTop: 20 }} onPress={onClose}>
                    <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Zrušit</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarcodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        try {
            const parsed = JSON.parse(data);
            if (parsed.url && parsed.token) {
                onScan(parsed.url, parsed.token);
            } else {
                alert('Neplatný QR kód. Musí obsahovat URL a Token.');
                setScanned(false);
            }
        } catch (e) {
            alert('Nečitelný QR kód. Zkuste to prosím znovu.');
            setScanned(false);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView 
                style={StyleSheet.absoluteFillObject} 
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />
            
            <View style={styles.overlay}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.middleContainer}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.focusedContainer}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <View style={styles.unfocusedContainer}></View>
                </View>
                <View style={styles.unfocusedContainer}>
                    <Text style={styles.text}>Namiřte fotoaparát na QR kód v nastavení administrace</Text>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Zavřít skener</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleContainer: {
        height: 250,
        flexDirection: 'row',
    },
    focusedContainer: {
        width: 250,
        height: 250,
        backgroundColor: 'transparent',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    cancelButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    cancelText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#3B82F6',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
});
